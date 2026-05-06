import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { ensurePortalUser } from "@/lib/userSync";

const ProfileSchema = z.object({
  businessGroup: z.string().min(1, "Business group is required"),
  IOU:           z.string().min(1, "IOU is required"),
  account:       z.string().min(1, "Account is required"),
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  // validate body
  const body   = await req.json();
  const parsed = ProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // update user profile in DB
  const portalUser = await ensurePortalUser(user);
  const updatedUser = await prisma.user.update({
    where: { id: portalUser.id },
    data: {
      businessGroup: parsed.data.businessGroup,
      IOU:           parsed.data.IOU,
      account:       parsed.data.account,
    },
  });

  return NextResponse.json({
    success: true,
    user:    updatedUser,
  });
});
