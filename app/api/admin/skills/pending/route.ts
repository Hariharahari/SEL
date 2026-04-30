import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/withAuth";
import redis from "@/lib/redis";
import { StoredSkillCard } from "@/lib/skillSchema";

export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const page  = parseInt(searchParams.get("page")  ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");

  // 1. get all starterkit_ids
  const skillIds = await redis.smembers("skills:index");

  if (skillIds.length === 0) {
    return NextResponse.json({ skills: [], total: 0, page, limit });
  }

  // 2. get ALL versions of ALL skills — not just latest
  //    because older versions might be pending even if latest is approved
  const keys = await redis.keys("skill:*:*");

  // filter out latest pointer keys e.g skill:id:latest
  const versionKeys = keys.filter((k) => !k.endsWith(":latest"));

  const skills: StoredSkillCard[] = [];

  await Promise.all(
    versionKeys.map(async (key) => {
      const data = await redis.get(key);
      if (!data) return;

      const skill = JSON.parse(data) as StoredSkillCard;

      // only pending — not approved and not rejected
      if (skill.is_approved || skill.is_rejected) return;

      skills.push(skill);
    })
  );

  // 3. sort by uploaded_at ascending — oldest first
  skills.sort((a, b) =>
    new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime()
  );

  // 4. paginate
  const total     = skills.length;
  const start     = (page - 1) * limit;
  const paginated = skills.slice(start, start + limit);

  return NextResponse.json({
    skills:     paginated,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});