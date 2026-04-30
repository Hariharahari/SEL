import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
import { StoredSkillCard } from "@/lib/skillSchema";
import { generateSkillEmbeddings } from "@/lib/embeddings";

export const POST = async (req: NextRequest) => {
  try {
    // 1. Get all skill IDs from index
    const skillIds = await redis.smembers("skills:index");

    if (skillIds.length === 0) {
      return NextResponse.json(
        { detail: "No skills found", embeddings_count: 0 },
        { status: 200 }
      );
    }

    // 2. Fetch latest approved version of each skill
    const skills: StoredSkillCard[] = [];

    await Promise.all(
      skillIds.map(async (skillId) => {
        const latestVersion = await redis.get(`skill:${skillId}:latest`);
        if (!latestVersion) return;

        const data = await redis.get(`skill:${skillId}:${latestVersion}`);
        if (!data) return;

        const skill = JSON.parse(data) as StoredSkillCard;

        // Only approved skills
        if (!skill.is_approved) return;

        skills.push(skill);
      })
    );

    if (skills.length === 0) {
      return NextResponse.json(
        { detail: "No approved skills found", embeddings_count: 0 },
        { status: 200 }
      );
    }

    // 3. Generate embeddings for all skills
    const embeddings = await generateSkillEmbeddings(skills);

    // 4. Store embeddings in Redis for batch processing
    await redis.set(
      "embeddings:pending",
      JSON.stringify(embeddings),
      "EX",
      3600 * 24 // 24 hours expiry
    );

    return NextResponse.json(
      {
        message: "Embeddings generated successfully",
        embeddings_count: Object.keys(embeddings).length,
        skills_processed: skills.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return NextResponse.json(
      { detail: "Failed to generate embeddings" },
      { status: 500 }
    );
  }
};
