import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import redis from "@/lib/redis";
import prisma from "@/lib/prisma";
import { StoredSkillCard } from "@/lib/skillSchema";

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const range = searchParams.get("range") ?? "all"; // 7d | 30d | all
  const take  = parseInt(searchParams.get("take") ?? "10");

  // 1. calculate date filter
  const now = new Date();
  const dateFilter =
    range === "7d"
      ? new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)
      : range === "30d"
      ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      : null;

  // 2. group downloads by skillId and count
  const downloads = await prisma.skillDownload.groupBy({
    by:      ["skillId"],
    where:   dateFilter ? { downloadedAt: { gte: dateFilter } } : {},
    _count:  { skillId: true },
    orderBy: { _count: { skillId: "desc" } },
    take,
  });

  if (downloads.length === 0) {
    return NextResponse.json({ trending: [], range, take });
  }

  // 3. enrich with skill card data from Redis
  const trending = await Promise.all(
    downloads.map(async (d) => {
      // get latest version
      const latestVersion = await redis.get(`skill:${d.skillId}:latest`);
      if (!latestVersion) return null;

      const data = await redis.get(`skill:${d.skillId}:${latestVersion}`);
      if (!data) return null;

      const skill = JSON.parse(data) as StoredSkillCard;

      return {
        skillId:       d.skillId,
        downloadCount: d._count.skillId,
        name:          skill.name,
        description:   skill.description,
        version:       latestVersion,
        status:        skill.status,
        technology:    skill.technology,
        specialization: skill.specialization.primary,
        uploaded_by:   skill.uploaded_by,
      };
    })
  );

  return NextResponse.json({
    range,
    take,
    trending: trending.filter(Boolean),
  });
});