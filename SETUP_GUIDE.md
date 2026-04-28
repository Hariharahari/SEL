# 🚀 Complete Setup Guide: Admin Dashboard with Redis Migration

## Step 1: Run Setup Script (Creates Admin User + Migrates Redis)

Open PowerShell in `starter_kit` folder and run:

```powershell
cd starter_kit
npx ts-node scripts/setup.ts
```

This will:
- ✅ Create admin user in PostgreSQL (`admin@test.com`)
- ✅ Migrate all 1000 agents from Redis to skills
- ✅ Verify database and Redis connection

Wait for message: **"Setup complete! You can now login"**

---

## Step 2: Start Backend

In the same `starter_kit` folder:

```powershell
npm run dev
```

Wait for:
```
✓ Ready in XXXms
- Local: http://localhost:3001
```

---

## Step 3: Start Frontend (New Terminal)

In root folder:

```powershell
npm run dev
```

Wait for:
```
- Local: http://localhost:3000
```

---

## Step 4: Test Login

1. Open browser: `http://localhost:3000/login`
2. Enter credentials:
   - **User ID**: `admin`
   - **Password**: `anything` (mock auth accepts any password)
3. Click "Sign In"

### Expected Results:

✅ **ADMIN User** → Redirected to `/admin` (Admin Dashboard)
✅ **Regular User** → Redirected to `/agents` (Agents Page)

---

## Step 5: Use Admin Dashboard

On `/admin` page, you'll see:

### Overview Tab:
- Total skills from Redis
- Approved/Rejected/Pending counts
- Average ratings
- User statistics

### Skills Approval Tab:
- Table of pending skills
- Approve/Reject buttons
- Real-time updates

### Analytics Tab:
- Category distribution
- Difficulty levels
- User stats
- Download metrics

---

## 🔧 Troubleshooting

### Issue: Still redirecting to /agents for admin user

**Solution**:
1. Make sure setup script ran successfully
2. Check database: 
   ```sql
   SELECT id, email, role FROM "User" WHERE id='admin';
   ```
   Should show role = 'ADMIN'

3. Clear browser cache (Ctrl+Shift+Delete)

4. If needed, update manually in psql:
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE id = 'admin';
   ```

### Issue: "No skills pending approval"

**Solution**:
- Migration script adds skills to Redis automatically
- Run setup script again to ensure migration completed
- Check Redis has data:
  ```bash
  redis-cli SCARD skills:all
  ```

### Issue: Cannot connect to backend

**Solution**:
- Both servers must be running on correct ports
- Backend: `http://localhost:3001`
- Frontend: `http://localhost:3000`
- Check no port conflicts

---

## ✅ Verification Checklist

After setup, verify everything:

```powershell
# 1. Backend running
curl http://localhost:3001/api/auth/me

# 2. Frontend running
curl http://localhost:3000

# 3. Redis has data
redis-cli SCARD skills:all  # Should return > 0

# 4. Database has admin user
# Connect to psql and check User table
```

---

## 📊 Redis Migration Details

The migration script:
- Reads agents from `agents_catalog` (Redis)
- Transforms each agent to skill format
- Stores in `skill:meta:${id}` (Redis)
- Creates indexes: `skills:all`, `skills:category:*`, etc.
- Stores ~1000+ skills total

---

## 🎯 Next: Create More Test Users

To test role-based redirects with different users:

```sql
-- In psql or any SQL client
INSERT INTO "User" (id, email, role) VALUES ('user1', 'user1@test.com', 'USER');
INSERT INTO "User" (id, email, role) VALUES ('user2', 'user2@test.com', 'USER');
```

Then login with:
- User ID: `user1` → Redirects to `/agents`
- User ID: `admin` → Redirects to `/admin`

---

**Ready? Run `npx ts-node scripts/setup.ts` in starter_kit folder first!** 🚀
