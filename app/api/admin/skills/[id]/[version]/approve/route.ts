import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/withAuth";
import redis from "@/lib/redis";
import { StoredSkillCard } from "@/lib/skillSchema";

export const POST = withAdmin(async (_req, { user, params }) => {
  const { id, version } = await params;
  const redisKey = `skill:${id}:${version}`;

  // 1. check skill exists
  const data = await redis.get(redisKey);
  if (!data) {
    return NextResponse.json(
      { error: `Skill ${id} version ${version} not found` },
      { status: 404 }
    );
  }

  const skill = JSON.parse(data) as StoredSkillCard;

  // 2. check not already approved
  if (skill.is_approved) {
    return NextResponse.json(
      { error: "Skill is already approved" },
      { status: 409 }
    );
  }

  // 3. approve
  const updated: StoredSkillCard = {
    ...skill,
    is_approved:    true,
    is_rejected:    false,
    approved_by:    user.user_id,
    approved_at:    new Date().toISOString(),
    rejected_by:    null,
    rejected_at:    null,
    rejection_note: null,
  };

  await redis.set(redisKey, JSON.stringify(updated));

  return NextResponse.json({
    success:     true,
    message:     "Skill approved successfully",
    approved_by: user.user_id,
    approved_at: updated.approved_at,
  });
});