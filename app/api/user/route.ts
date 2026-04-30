import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import prisma from "@/lib/prisma";

export const DELETE = withAuth(async (_req, { user }) => {
  await prisma.user.delete({
    where: { id: user.user_id },
  });

  // clear cookies
  const response = NextResponse.json({
    success: true,
    message: "User deleted successfully",
  });

  response.cookies.delete(process.env.COOKIE_NAME!);
  response.cookies.delete(process.env.COOKIE_REFRESH_NAME!);

  return response;
});