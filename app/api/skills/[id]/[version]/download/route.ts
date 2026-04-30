import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import redis from "@/lib/redis";
import prisma from "@/lib/prisma";
import { StoredSkillCard } from "@/lib/skillSchema";
import { z } from "zod";

const DownloadSchema = z.object({
  purpose: z.string().min(1, "Purpose is required"),
});

export const POST = withAuth(async (req: NextRequest, { user, params }) => {
  const { id, version } = await params;

  // 1. validate body
  const body   = await req.json();
  const parsed = DownloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { purpose } = parsed.data;

  // 2. get skill from Redis
  const data = await redis.get(`skill:${id}:${version}`);
  if (!data) {
    return NextResponse.json(
      { error: `Skill ${id} version ${version} not found` },
      { status: 404 }
    );
  }

  const skill = JSON.parse(data) as StoredSkillCard;

  // 3. only approved skills can be downloaded
  if (!skill.is_approved) {
    return NextResponse.json(
      { error: "Skill is not approved yet" },
      { status: 403 }
    );
  }

  // 4. record download in DB
  await prisma.skillDownload.upsert({
    where: {
      userId_skillId_version: {
        userId:  user.user_id,
        skillId: id,
        version,
      },
    },
    update: {
      downloadedAt: new Date(),
      purpose,
    },
    create: {
      userId:  user.user_id,
      skillId: id,
      version,
      purpose,
    },
  });

  return NextResponse.json({
    success: true,
    message: "Download recorded successfully",
    data: {
      skillId:      id,
      version,
      purpose,
      file_url:     skill.file_url,  
      downloadedAt: new Date().toISOString(),
    },
  });
});