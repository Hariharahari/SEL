import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import prisma from "@/lib/prisma";
import { ensurePortalUser } from "@/lib/userSync";

export const GET = withAuth(async (_req, { user }) => {
  await ensurePortalUser(user);

  // get db data for this user
  const dbUser = await prisma.user.findUnique({
    where: { id: user.user_id },
  });

  return NextResponse.json({
    // from central auth
    user_id:              user.user_id,
    email:                user.email,
    role:                 user.role,
    must_change_password: user.must_change_password,
    password_expired:     user.password_expired,
    created_at:           user.created_at,
    // from your DB
    dbData: dbUser,
  });
});
