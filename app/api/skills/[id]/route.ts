import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import redis from "@/lib/redis";
import { StoredSkillCard } from "@/lib/skillSchema";

export const GET = withAuth(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const { searchParams } = req.nextUrl;
  const version = searchParams.get("version"); // optional — defaults to latest

  // 1. get version to fetch
  let targetVersion = version;
  if (!targetVersion) {
    targetVersion = await redis.get(`skill:${id}:latest`);
  }

  if (!targetVersion) {
    return NextResponse.json(
      { error: `Skill ${id} not found` },
      { status: 404 }
    );
  }

  // 2. get skill card
  const data = await redis.get(`skill:${id}:${targetVersion}`);
  if (!data) {
    return NextResponse.json(
      { error: `Skill ${id} version ${targetVersion} not found` },
      { status: 404 }
    );
  }

  const skill = JSON.parse(data) as StoredSkillCard;

  // 3. only return if approved
  if (!skill.is_approved) {
    return NextResponse.json(
      { error: "Skill is not approved yet" },
      { status: 403 }
    );
  }

  return NextResponse.json(skill);
});