# JWT Authentication & OpenAPI Integration Guide

## Overview

This document describes the JWT authentication system implemented in the agents-directory project and how it integrates with the OpenAPI specification defined in `openapi.json`.

## Table of Contents

1. [OpenAPI Specification Analysis](#openapi-specification-analysis)
2. [Authentication Flow](#authentication-flow)
3. [Security Implementation](#security-implementation)
4. [TypeScript Type Integration](#typescript-type-integration)
5. [API Reference](#api-reference)
6. [Generating SDK from OpenAPI](#generating-sdk-from-openapi)
7. [Production Deployment](#production-deployment)

---

## OpenAPI Specification Analysis

### Key Endpoints from `openapi.json`

The backend API (SEL Platform Backend v1.0.0) defines the following authentication endpoints:

| Endpoint | Method | Purpose | Security |
|----------|--------|---------|----------|
| `/api/auth/login` | POST | User authentication | None (public) |
| `/api/auth/refresh` | POST | Token refresh | None (public) |
| `/api/auth/logout` | POST | Token revocation | HTTPBearer |
| `/api/auth/me` | GET | Current user profile | HTTPBearer |
| `/api/auth/set-password` | POST | Change password | HTTPBearer |
| `/api/auth/register` | POST | Create new user | HTTPBearer (admin only) |
| `/api/auth/bootstrap` | POST | First admin setup | X-Admin-Setup-Secret header |

### Security Scheme

```
HTTPBearer (Bearer token in Authorization header)
Format: Authorization: Bearer {access_token}
```

---

## Authentication Flow

### 1. Login Flow

```
User → POST /api/auth/login → Backend
  {
    "user_id": "john_doe",
    "password": "SecurePassword123"
  }
↓
Backend Response (200 OK):
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..._refresh",
    "token_type": "bearer",
    "expires_in": 3600,
    "user_id": "john_doe",
    "role": "user",
    "must_change_password": false
  }
```

**Key Points:**
- `user_id` is required (NOT email address)
- `password` must be at least 8 characters
- Response includes both `access_token` and `refresh_token`
- `expires_in` is in seconds (1 hour by default)
- Token is saved to localStorage by the frontend

### 2. Token Refresh Flow

When token approaches expiration (within 60 seconds):

```
Frontend → POST /api/auth/refresh
  {
    "refresh_token": "existing_refresh_token"
  }
↓
Backend Response (200 OK):
  {
    "access_token": "new_access_token",
    "token_type": "bearer",
    "expires_in": 3600
  }
```

**Implementation:** Uses `tokenStorage.shouldRefreshToken()` to check if refresh is needed.

### 3. Authenticated Request Flow

All authenticated endpoints require the Authorization header:

```
GET /api/auth/me
Authorization: Bearer {access_token}
Content-Type: application/json
```

### 4. Logout Flow

```
POST /api/auth/logout
Authorization: Bearer {access_token}
Content-Type: application/json
  {
    "refresh_token": "token_to_revoke"
  }
```

---

## Security Implementation

### Frontend Security

#### 1. Token Storage

- **Location:** `localStorage` with key `auth_state`
- **Content:** `StoredAuthState` object containing:
  - `access_token`
  - `refresh_token`
  - `user_id`
  - `role`
  - `expires_at` (Unix timestamp in milliseconds)

```typescript
interface StoredAuthState {
  access_token: string;
  refresh_token: string;
  user_id: string;
  role: "user" | "admin";
  expires_at: number; // Unix timestamp in milliseconds
}
```

#### 2. Token Expiration Handling

- Tokens are checked against `expires_at` timestamp
- Expired tokens are automatically cleared
- Automatic refresh occurs 60 seconds before expiration via `TOKEN_REFRESH_BUFFER`

#### 3. Authorization Headers

All authenticated requests include:

```typescript
{
  "Authorization": "Bearer {access_token}",
  "Content-Type": "application/json"
}
```

### Backend Security

#### 1. Download Endpoint Protection

The `/api/agents/[id]/download-github` endpoint requires Authorization:

```typescript
// Verify Authorization header first
if (!verifyAuthorizationHeader(request)) {
  return NextResponse.json(
    { detail: 'Missing or invalid Authorization header', error: 'AuthenticationError' },
    { status: 401 }
  );
}
```

#### 2. Authorization Header Validation

```typescript
function verifyAuthorizationHeader(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  
  // Must exist and start with 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  
  // Must have valid JWT format (3 parts separated by dots)
  const parts = token.split('.');
  return parts.length === 3 && parts.every(p => p.length > 0);
}
```

---

## TypeScript Type Integration

### Generated Types

All types are defined in `/types/auth.ts` and match the OpenAPI specification:

- `LoginRequest` - POST request body
- `LoginResponse` - Login response
- `RefreshRequest` / `RefreshResponse` - Token refresh
- `UserProfile` - Current user info
- `AuthState` - React context state
- `StoredAuthState` - localStorage format

### Usage

```typescript
import { LoginResponse, UserProfile, AuthState } from '@/types/auth';
import { authApi, authValidation } from '@/lib/auth';
import { useAuth, useUser } from '@/contexts/auth';
```

---

## API Reference

### Authentication Utilities (`lib/auth.ts`)

#### `authValidation`

```typescript
// Validate user_id
authValidation.isValidUserId(user_id: string): boolean

// Validate email
authValidation.isValidEmail(email: string): boolean

// Validate password
authValidation.validatePassword(password: string): { isValid: boolean; reason?: string }

// Validate login input (flexible - accepts email or username)
authValidation.isValidLoginInput(user_id: string): boolean
```

#### `tokenStorage`

```typescript
// Save/retrieve authentication state
tokenStorage.saveAuthState(state: StoredAuthState): void
tokenStorage.getAuthState(): StoredAuthState | null
tokenStorage.clearAuthState(): void

// Token access
tokenStorage.getAccessToken(): string | null
tokenStorage.getRefreshToken(): string | null

// Token lifecycle
tokenStorage.shouldRefreshToken(): boolean
```

#### `authApi`

```typescript
// Login
authApi.login(user_id: string, password: string)
  → { success: true; data: LoginResponse } | { success: false; error: string }

// Refresh token
authApi.refreshAccessToken()
  → { success: true; data: RefreshResponse } | { success: false; error: string }

// Get current user
authApi.getCurrentUser()
  → { success: true; data: UserProfile } | { success: false; error: string }

// Logout
authApi.logout()
  → { success: boolean; error?: string }
```

### React Hooks (`contexts/auth.tsx`)

```typescript
// Access full auth context
const auth = useAuth()
// Returns: { isAuthenticated, isLoading, user, error, accessToken, login, logout, refreshToken, getUser }

// Check authentication status
const isAuth = useIsAuthenticated()

// Get current user
const user = useUser()

// Get access token
const token = useAccessToken()
```

---

## Generating SDK from OpenAPI

### Option 1: OpenAPI Generator CLI

```bash
npm install -g @openapitools/openapi-generator-cli

openapi-generator-cli generate \
  -i ./openapi.json \
  -g typescript-fetch \
  -o ./generated/api-client
```

### Option 2: OpenAPI TypeScript Codegen

```bash
npm install -D @openapi-ts/openapi-typescript

npx openapi-typescript ./openapi.json -o ./types/api.ts
```

### Option 3: Manual Type Generation (Current Approach)

We manually created types in `/types/auth.ts` to match the OpenAPI specification exactly. This provides:

- Full TypeScript support
- Smaller bundle size
- Complete control over implementation
- No external code generation dependencies

---

## API Endpoints Implementation

### Mock Endpoints (Development)

The following mock endpoints are implemented for development:

#### POST `/api/auth/login`
```typescript
// File: app/api/auth/login/route.ts
// Accepts: LoginRequest { user_id, password }
// Returns: LoginResponse with tokens
// Status: 200 (success) | 422 (validation error) | 401 (auth error)
```

#### GET `/api/auth/me`
```typescript
// File: app/api/auth/me/route.ts
// Requires: Authorization header
// Returns: UserProfile
// Status: 200 (success) | 401 (unauthorized)
```

#### POST `/api/auth/refresh`
```typescript
// File: app/api/auth/refresh/route.ts
// Accepts: RefreshRequest { refresh_token }
// Returns: RefreshResponse
// Status: 200 (success)
```

#### POST `/api/auth/logout`
```typescript
// File: app/api/auth/logout/route.ts
// Accepts: LogoutRequest { refresh_token }
// Returns: { message: 'Logged out successfully' }
// Status: 200 (success)
```

---

## Production Deployment

### Security Checklist

- [ ] **HTTPS Only**: All authentication endpoints must use HTTPS
- [ ] **Secure Cookies**: Consider moving tokens to HttpOnly cookies
- [ ] **Token Signing**: Use proper JWT signing with RS256 algorithm
- [ ] **Token Verification**: Verify JWT signature on every request
- [ ] **Rate Limiting**: Implement rate limiting on login endpoint
- [ ] **CORS Configuration**: Restrict CORS to trusted domains
- [ ] **Password Policy**: Enforce strong password requirements
- [ ] **MFA/2FA**: Consider implementing multi-factor authentication
- [ ] **Refresh Token Rotation**: Rotate refresh tokens on use
- [ ] **Token Revocation**: Implement proper token blacklist
- [ ] **Session Management**: Track active sessions
- [ ] **Audit Logging**: Log all auth events

### Backend Integration Steps

1. **Replace Mock Endpoints**
   - Implement actual database queries in `/api/auth/*` routes
   - Use proper JWT signing libraries (e.g., `jsonwebtoken`)
   - Validate passwords against hashed values

2. **Update Token Verification**
   - Replace mock token parsing with proper JWT verification
   - Validate signature using backend secret key
   - Check token claims (exp, iat, sub)

3. **Implement Token Refresh**
   - Create refresh token storage (Redis or database)
   - Implement token rotation strategy
   - Handle refresh token revocation on logout

4. **Add Rate Limiting**
   ```typescript
   import rateLimit from 'express-rate-limit';
   
   const loginLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 5 // 5 attempts per window
   });
   ```

5. **Environment Variables**
   ```
   JWT_SECRET=your_secret_key_here
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRY=3600
   REFRESH_TOKEN_EXPIRY=604800
   DATABASE_URL=your_database_url
   REDIS_URL=your_redis_url
   ```

---

## Demo Credentials (Development Only)

```
User ID: testuser
Password: TestPass123
```

⚠️ **These credentials are for development/testing only and should be removed before production deployment.**

---

## Common Issues & Solutions

### Issue: Token not persisting after refresh

**Solution:** Check that `tokenStorage.saveAuthState()` is being called with correct `expires_at` timestamp:

```typescript
const expiresAt = Date.now() + data.expires_in * 1000;
```

### Issue: Unauthorized errors on protected endpoints

**Solution:** Verify Authorization header format:

```typescript
// ❌ Wrong
Authorization: Bearer
Authorization: bearer {token}

// ✅ Correct
Authorization: Bearer {token}
```

### Issue: Token expiring too quickly

**Solution:** Check that `expires_in` from server is in seconds (not milliseconds):

```typescript
// Server returns expires_in in SECONDS
const expiresAt = Date.now() + data.expires_in * 1000; // Multiply by 1000
```

---

## References

- OpenAPI Specification: `openapi.json` (root)
- Authentication Types: `/types/auth.ts`
- Authentication Utilities: `/lib/auth.ts`
- Authentication Context: `/contexts/auth.tsx`
- Login Page: `/app/login/page.tsx`
- Navbar Component: `/components/Navbar.tsx`
- Download Route: `/app/api/agents/[id]/download-github/route.ts`

---

## Next Steps

1. **Pre-Production**
   - Implement real database authentication
   - Set up proper JWT signing with RS256
   - Implement rate limiting
   - Add comprehensive error logging

2. **Post-Deployment**
   - Monitor authentication failures
   - Implement automated security audits
   - Regular penetration testing
   - Keep dependencies updated

---

*Last Updated: 2026-04-25*
*Document Version: 1.0*
