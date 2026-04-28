/**
 * Authentication Utilities
 * Handles token management, validation, storage, and API communication
 */

import {
  LoginRequest,
  LoginResponse,
  LoginError,
  RefreshRequest,
  RefreshResponse,
  StoredAuthState,
  UserProfile,
} from "@/types/auth";

const STORAGE_KEY = "auth_state";
const TOKEN_REFRESH_BUFFER = 60; // Refresh token 60 seconds before expiry

/**
 * Validation utilities
 */
export const authValidation = {
  /**
   * Validate user_id format
   * @param user_id - User ID to validate
   * @returns true if valid
   */
  isValidUserId(user_id: string): boolean {
    return user_id.trim().length >= 3 && user_id.trim().length <= 255;
  },

  /**
   * Validate email format
   * @param email - Email to validate
   * @returns true if valid email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate password strength
   * @param password - Password to validate
   * @returns object with isValid and reason
   */
  validatePassword(password: string): {
    isValid: boolean;
    reason?: string;
  } {
    if (password.length < 8) {
      return { isValid: false, reason: "Password must be at least 8 characters" };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, reason: "Password must contain uppercase letters" };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, reason: "Password must contain lowercase letters" };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, reason: "Password must contain numbers" };
    }
    return { isValid: true };
  },

  /**
   * Validate user_id (can be username, email, or ID)
   * Accepts various formats for flexibility
   */
  isValidLoginInput(user_id: string): boolean {
    const trimmed = user_id.trim();
    // Allow emails, usernames (3+ chars), or user IDs
    return (
      this.isValidEmail(trimmed) ||
      (trimmed.length >= 3 && trimmed.length <= 255)
    );
  },
};

/**
 * Token storage utilities
 */
export const tokenStorage = {
  /**
   * Save authentication state to localStorage
   */
  saveAuthState(state: StoredAuthState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save auth state:", error);
    }
  },

  /**
   * Retrieve authentication state from localStorage
   */
  getAuthState(): StoredAuthState | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Failed to retrieve auth state:", error);
      return null;
    }
  },

  /**
   * Clear authentication state from localStorage
   */
  clearAuthState(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear auth state:", error);
    }
  },

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    const state = this.getAuthState();
    if (!state) return null;

    // Check if token has expired
    if (Date.now() >= state.expires_at) {
      this.clearAuthState();
      return null;
    }

    return state.access_token;
  },

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    const state = this.getAuthState();
    return state?.refresh_token || null;
  },

  /**
   * Check if token needs refresh
   */
  shouldRefreshToken(): boolean {
    const state = this.getAuthState();
    if (!state) return false;

    const timeUntilExpiry = state.expires_at - Date.now();
    return timeUntilExpiry < TOKEN_REFRESH_BUFFER * 1000;
  },
};

/**
 * API client utilities
 */

// Get backend URL
const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    return window.__AUTH_API_URL__ || 'http://localhost:3001';
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
};

export const authApi = {
  /**
   * Login with user_id and password
   * Follows OpenAPI contract: POST /api/auth/login
   */
  async login(
    user_id: string,
    password: string
  ): Promise<{ success: true; data: LoginResponse } | { success: false; error: string }> {
    try {
      const payload: LoginRequest = { user_id, password };
      const backendUrl = getBackendUrl();

      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = "Login failed";
        try {
          const errorData: LoginError = await response.json();
          errorMessage =
            errorData.detail ||
            errorData.error ||
            errorData.message ||
            errorMessage;
        } catch {
          // Response not JSON, use status
          errorMessage = `Login failed (${response.status})`;
        }
        return { success: false, error: errorMessage };
      }

      const data: LoginResponse = await response.json();

      // Save to localStorage
      const expiresAt = Date.now() + data.expires_in * 1000;
      tokenStorage.saveAuthState({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user_id: data.user_id,
        role: data.role,
        expires_at: expiresAt,
      });

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      };
    }
  },

  /**
   * Refresh access token using refresh token
   * Follows OpenAPI contract: POST /api/auth/refresh
   */
  async refreshAccessToken(): Promise<{ success: true; data: RefreshResponse } | { success: false; error: string }> {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        return {
          success: false,
          error: "No refresh token available",
        };
      }

      const payload: RefreshRequest = { refresh_token: refreshToken };
      const backendUrl = getBackendUrl();

      const response = await fetch(`${backendUrl}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        tokenStorage.clearAuthState();
        return {
          success: false,
          error: "Token refresh failed. Please login again.",
        };
      }

      const data: RefreshResponse = await response.json();

      // Update stored state with new access token
      const state = tokenStorage.getAuthState();
      if (state) {
        const expiresAt = Date.now() + data.expires_in * 1000;
        tokenStorage.saveAuthState({
          ...state,
          access_token: data.access_token,
          expires_at: expiresAt,
        });
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Token refresh failed",
      };
    }
  },

  /**
   * Fetch current user profile
   * Follows OpenAPI contract: GET /api/auth/me
   */
  async getCurrentUser(): Promise<{ success: true; data: UserProfile } | { success: false; error: string }> {
    try {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        return {
          success: false,
          error: "No authentication token",
        };
      }

      const backendUrl = getBackendUrl();

      const response = await fetch(`${backendUrl}/api/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.status === 401) {
        tokenStorage.clearAuthState();
        return {
          success: false,
          error: "Session expired. Please login again.",
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch user profile (${response.status})`,
        };
      }

      const data: UserProfile = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch user profile",
      };
    }
  },

  /**
   * Logout - revoke refresh token
   * Follows OpenAPI contract: POST /api/auth/logout
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      const backendUrl = getBackendUrl();

      if (refreshToken) {
        // Attempt to revoke token on backend
        try {
          await fetch(`${backendUrl}/api/auth/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ refresh_token: refreshToken }),
          }).catch(() => {
            // Logout endpoint might fail, but we still clear local state
          });
        } catch (error) {
          console.error("Logout API call failed:", error);
        }
      }

      // Clear local storage regardless of API success
      tokenStorage.clearAuthState();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Logout failed",
      };
    }
  },
};

/**
 * Get Authorization header for API requests
 */
export function getAuthHeaders(): Record<string, string> {
  const token = tokenStorage.getAccessToken();
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
}

/**
 * Check if user is currently authenticated
 */
export function isAuthenticated(): boolean {
  return tokenStorage.getAccessToken() !== null;
}

/**
 * Parse error message from various API error formats
 */
export function parseApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const err = error as any;
    return (
      err.detail ||
      err.error ||
      err.message ||
      JSON.stringify(error)
    );
  }

  return "An unexpected error occurred";
}
