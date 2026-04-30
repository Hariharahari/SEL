import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/withAuth";
import redis from "@/lib/redis";
import { StoredSkillCard } from "@/lib/skillSchema";
import { z } from "zod";

const RejectSchema = z.object({
  rejection_note: z.string().min(1, "Rejection note is required"),
});

export const POST = withAdmin(async (req: NextRequest, { user, params }) => {
  const { id, version } = await params;
  const redisKey = `skill:${id}:${version}`;

  // 1. validate body
  const body   = await req.json();
  const parsed = RejectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // 2. check skill exists
  const data = await redis.get(redisKey);
  if (!data) {
    return NextResponse.json(
      { error: `Skill ${id} version ${version} not found` },
      { status: 404 }
    );
  }

  const skill = JSON.parse(data) as StoredSkillCard;

  // 3. check not already rejected
  if (skill.is_rejected) {
    return NextResponse.json(
      { error: "Skill is already rejected" },
      { status: 409 }
    );
  }

  // 4. reject
  const updated: StoredSkillCard = {
    ...skill,
    is_approved:    false,
    is_rejected:    true,
    rejected_by:    user.user_id,
    rejected_at:    new Date().toISOString(),
    rejection_note: parsed.data.rejection_note,
    approved_by:    null,
    approved_at:    null,
  };

  await redis.set(redisKey, JSON.stringify(updated));

  return NextResponse.json({
    success:        true,
    message:        "Skill rejected",
    rejected_by:    user.user_id,
    rejected_at:    updated.rejected_at,
    rejection_note: parsed.data.rejection_note,
  });
});