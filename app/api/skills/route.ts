import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import redis from "@/lib/redis";
import { StoredSkillCard } from "@/lib/skillSchema";

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;

  const technology  = searchParams.get("technology");
  const category    = searchParams.get("category");
  const subcategory = searchParams.get("subcategory");

  const page  = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");

  // 1. get all skillIds
  const skillIds = await redis.smembers("skills:index");

  if (skillIds.length === 0) {
    return NextResponse.json({ skills: [], total: 0, page, limit });
  }

  const skills: StoredSkillCard[] = [];

  await Promise.all(
    skillIds.map(async (skillId) => {
      const latestVersion = await redis.get(`skill:${skillId}:latest`);
      if (!latestVersion) return;

      const data = await redis.get(`skill:${skillId}:${latestVersion}`);
      if (!data) return;

      const skill = JSON.parse(data) as StoredSkillCard;

      // ✅ only approved
      if (!skill.is_approved) return;

      // ✅ technology filter
      if (technology && !skill.technology?.includes(technology)) return;

      // ✅ category filter
      if (category && skill.category !== category) return;

      // ✅ subcategory filter
      if (subcategory && skill.subcategory !== subcategory) return;

      skills.push(skill);
    })
  );

  // sort
  skills.sort(
    (a, b) =>
      new Date(b.uploaded_at).getTime() -
      new Date(a.uploaded_at).getTime()
  );

  // pagination
  const total = skills.length;
  const start = (page - 1) * limit;
  const paginated = skills.slice(start, start + limit);

  return NextResponse.json({
    skills: paginated,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});