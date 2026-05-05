import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { ensurePortalUserSafe, getPortalUserSafe } from "@/lib/userSync";

export const GET = withAuth(async (_req, { user }) => {
  const syncedUser = await ensurePortalUserSafe(user);

  // get db data for this user when PostgreSQL is available
  const dbUser = syncedUser || (await getPortalUserSafe(user.user_id));

  return NextResponse.json({
    // from central auth
    user_id:              user.user_id,
    email:                user.email,
    role:                 user.role,
    name:                 user.name,
    must_change_password: user.must_change_password,
    password_expired:     user.password_expired,
    created_at:           user.created_at,
    // from your DB
    dbData: dbUser,
    dbAvailable: dbUser !== null,
  });
});
