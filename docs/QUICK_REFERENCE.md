# Quick Reference: JWT Authentication System

## 🚀 Quick Start (5 minutes)

### 1. Test Login
```
URL: http://localhost:3000/login
User ID: testuser
Password: TestPass123
```

### 2. After Login
- Token auto-saved to localStorage
- User info shown in navbar
- Can access protected features

### 3. Access Token in Components
```typescript
import { useAuth, useUser } from '@/contexts/auth';

function MyComponent() {
  const { isAuthenticated } = useAuth();
  const user = useUser();
  
  return isAuthenticated ? <p>Hello {user?.user_id}</p> : null;
}
```

---

## 📂 File Structure

```
/types
  └── auth.ts (TypeScript types)

/lib
  └── auth.ts (Utilities: authApi, tokenStorage, authValidation)

/contexts
  └── auth.tsx (AuthProvider, useAuth hook)

/app
  └── layout.tsx (Wrapped with AuthProvider)
  └── login/page.tsx (Enhanced login UI)
  └── api/auth/
      ├── login/route.ts (POST /api/auth/login)
      ├── me/route.ts (GET /api/auth/me)
      ├── refresh/route.ts (POST /api/auth/refresh)
      └── logout/route.ts (POST /api/auth/logout)

/components
  └── Navbar.tsx (Auth UI - Sign In/Logout)

/docs
  ├── JWT_AUTHENTICATION.md (Full documentation)
  └── IMPLEMENTATION_SUMMARY.md (What was done)
```

---

## 🔑 Key Functions

### Validation (`authValidation`)
```typescript
authValidation.isValidUserId(id)           // 3+ characters
authValidation.isValidEmail(email)         // Valid email
authValidation.validatePassword(pwd)       // 8+, uppercase, lowercase, numbers
authValidation.isValidLoginInput(input)    // Email or username (flexible)
```

### Token Storage (`tokenStorage`)
```typescript
tokenStorage.getAccessToken()      // Returns token or null if expired
tokenStorage.getRefreshToken()     // Returns refresh token
tokenStorage.shouldRefreshToken()  // Check if refresh needed
tokenStorage.saveAuthState(state)  // Save to localStorage
tokenStorage.clearAuthState()      // Clear localStorage
```

### API Client (`authApi`)
```typescript
authApi.login(user_id, password)              // POST /api/auth/login
authApi.refreshAccessToken()                  // POST /api/auth/refresh
authApi.getCurrentUser()                      // GET /api/auth/me
authApi.logout()                              // POST /api/auth/logout
```

### React Hooks (`useAuth`, etc.)
```typescript
useAuth()              // Full auth context
useIsAuthenticated()   // Is user logged in?
useUser()              // Get current user
useAccessToken()       // Get access token
```

---

## 🔄 Common Tasks

### Check if User is Logged In
```typescript
const { isAuthenticated } = useAuth();
if (isAuthenticated) {
  // Show protected content
}
```

### Get Current User Info
```typescript
const user = useUser();
console.log(user?.user_id);   // Username
console.log(user?.email);     // Email
console.log(user?.role);      // "user" or "admin"
```

### Manual Login
```typescript
import { authApi } from '@/lib/auth';

const result = await authApi.login('testuser', 'TestPass123');
if (result.success) {
  // Login successful, redirect
  router.push('/agents');
} else {
  // Show error
  alert(result.error);
}
```

### Logout
```typescript
import { useAuth } from '@/contexts/auth';

const { logout } = useAuth();
await logout(); // Clears tokens, redirects
```

### Protected Endpoints
```typescript
// All endpoints need Authorization header
// This is automatically handled by authApi!

const result = await authApi.getCurrentUser();
// No manual header needed
```

---

## 📱 Frontend Flow

```
1. User visits http://localhost:3000/login
2. Enters testuser / TestPass123
3. Click "Sign In"
4. POST /api/auth/login
5. ✅ Token saved to localStorage
6. ✅ Redirected to /agents
7. ✅ User shown in navbar
8. ✅ Can download agents (needs auth)
```

---

## 🔐 Backend Integration Checklist

### When Ready for Real Backend:
- [ ] Replace `/app/api/auth/*` routes with real implementation
- [ ] Use database for user storage
- [ ] Hash passwords with bcrypt
- [ ] Generate real JWTs with signing key
- [ ] Add rate limiting (login endpoint)
- [ ] Implement token refresh rotation
- [ ] Set up token blacklist on logout
- [ ] Add comprehensive error logging
- [ ] Configure HTTPS
- [ ] Set environment variables

### Environment Variables Needed
```bash
JWT_SECRET=your_secret_key_here
JWT_ALGORITHM=RS256
ACCESS_TOKEN_EXPIRY=3600
REFRESH_TOKEN_EXPIRY=604800
DATABASE_URL=your_db_url
```

---

## 🐛 Debugging

### Check Token in Browser
```javascript
// Open DevTools Console
localStorage.getItem('auth_state')
```

### Check Auth State
```typescript
import { useAuth } from '@/contexts/auth';

export default function DebugComponent() {
  const auth = useAuth();
  console.log('Auth State:', auth);
  return null;
}
```

### Verify Authorization Header
```typescript
import { getAuthHeaders } from '@/lib/auth';

console.log(getAuthHeaders());
// Output: { Authorization: "Bearer token...", "Content-Type": "application/json" }
```

---

## ⚡ Performance

- **Token Refresh**: Auto-refresh 60 seconds before expiration
- **localStorage**: Checked on app load
- **Context**: Minimal re-renders via proper state management
- **Bundle Size**: No new dependencies added

---

## 🎯 OpenAPI Compliance

✅ Uses correct field names (`user_id` not `email`)
✅ Returns required fields (access_token, refresh_token, expires_in)
✅ HTTPBearer authentication scheme
✅ Proper error responses (401, 422)
✅ Token format: Bearer scheme

---

## 📊 Token Lifecycle

```
Login
  ↓
Access Token (1 hour)
  ├─ 60 sec before expiry → Auto-refresh
  └─ After expiry → Cleared
  
Refresh Token
  ├─ Used to get new access token
  └─ Revoked on logout

Logout
  ├─ Token cleared from localStorage
  └─ Refresh token revoked on backend
```

---

## 🚨 Common Errors

### "Missing or invalid Authorization header"
**Cause:** Trying to access protected endpoint without token
**Fix:** Make sure user is logged in first
```typescript
if (!isAuthenticated) {
  router.push('/login');
}
```

### "Login failed. Please check your credentials."
**Cause:** Wrong password or user doesn't exist
**Demo:** testuser / TestPass123

### "Token refresh failed"
**Cause:** Refresh token expired or revoked
**Fix:** Redirect to login
```typescript
if (!result.success) {
  router.push('/login');
}
```

---

## 📞 Need Help?

1. **Check Types**: Look at `/types/auth.ts` for interfaces
2. **Check Docs**: See `/docs/JWT_AUTHENTICATION.md`
3. **Check Code**: Comments in `/lib/auth.ts` explain everything
4. **Check Examples**: Login page shows real usage

---

## 🎓 Learning Path

1. **Understand Types** → Read `/types/auth.ts` (5 min)
2. **Understand Utils** → Read `/lib/auth.ts` (15 min)
3. **Understand Context** → Read `/contexts/auth.tsx` (10 min)
4. **Test Login** → Try with demo credentials (2 min)
5. **Try in Component** → Use `useAuth()` hook (5 min)

**Total: ~35 minutes to full understanding**

---

## 🔄 Data Flow Diagram

```
Browser
  ├─ Login Form → POST /api/auth/login
  ├─ Token → localStorage (auth_state)
  ├─ useAuth() ← AuthContext ← localStorage
  └─ Components ← useAuth(), useUser()

Protected Endpoints
  ├─ Authorization: Bearer {token}
  └─ GET /api/auth/me (verified in context init)
```

---

**Remember:** 
- Demo credentials work only in development
- Replace mock endpoints before production
- Keep `JWT_SECRET` safe in environment variables
- HTTPS required in production

---

*Quick Reference v1.0 - April 25, 2026*
