/**
 * Authentication Types Generated from OpenAPI Specification
 * Backend: SEL Platform Backend - Agent Discovery & Workflow Orchestration v1.0.0
 * 
 * This file contains TypeScript types matching the real API contract.
 * Reference: /api/auth/* endpoints in openapi.json
 */

/**
 * Login Request - POST /api/auth/login
 * @description Authenticate with user_id + password and receive tokens.
 */
export interface LoginRequest {
  /** Unique user identifier (not email) */
  user_id: string;
  /** User password */
  password: string;
}

/**
 * Login Response - Success response from POST /api/auth/login
 * @description Contains both access and refresh tokens along with user info
 */
export interface LoginResponse {
  /** JWT access token for API requests */
  access_token: string;
  /** Refresh token to get new access tokens */
  refresh_token: string;
  /** Token type (always "bearer") */
  token_type: "bearer";
  /** Access token expiry in seconds */
  expires_in: number;
  /** User ID of authenticated user */
  user_id: string;
  /** User role: "user" or "admin" */
  role: "user" | "admin";
  /** Whether user must change password on next login */
  must_change_password: boolean;
  /** Whether password has expired */
  password_expired?: boolean;
}

/**
 * Refresh Request - POST /api/auth/refresh
 * @description Exchange a valid refresh token for a new access token
 */
export interface RefreshRequest {
  /** Valid refresh token */
  refresh_token: string;
}

/**
 * Refresh Response - Success response from POST /api/auth/refresh
 * @description New access token and expiry
 */
export interface RefreshResponse {
  /** New JWT access token */
  access_token: string;
  /** Token type (always "bearer") */
  token_type: "bearer";
  /** Access token expiry in seconds */
  expires_in: number;
}

/**
 * Logout Request - POST /api/auth/logout
 * @description Revoke a refresh token to logout
 */
export interface LogoutRequest {
  /** Refresh token to revoke */
  refresh_token: string;
}

/**
 * Set Password Request - POST /api/auth/set-password
 * @description Change own password - requires current password verification
 */
export interface SetPasswordRequest {
  /** Current password for verification */
  current_password: string;
  /** New password */
  new_password: string;
}

/**
 * User Profile from GET /api/auth/me
 * @description Currently authenticated user's profile
 */
export interface UserProfile {
  /** User identifier */
  user_id: string;
  /** User email */
  email: string;
  /** User role */
  role: "user" | "admin";
  /** User display name */
  name?: string;
  /** Whether password must be changed */
  must_change_password?: boolean;
}

/**
 * Security Headers for API Requests
 * @description Standard headers required for authenticated API calls
 */
export interface AuthHeaders {
  "Authorization": string; // "Bearer {access_token}"
  "Content-Type": "application/json";
}

/**
 * Stored Auth State (localStorage)
 * @description Minimal state stored in localStorage for session persistence
 */
export interface StoredAuthState {
  access_token: string;
  refresh_token: string;
  user_id: string;
  role: "user" | "admin";
  expires_at: number; // Unix timestamp in milliseconds
}

/**
 * Auth Context State
 * @description Full authentication state for React context
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: Omit<UserProfile, "must_change_password"> | null;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}

/**
 * Login Error Response
 * @description API error response from failed login
 */
export interface LoginError {
  detail?: string;
  error?: string;
  message?: string;
  status?: number;
}
