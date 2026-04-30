import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import redis from "@/lib/redis";
import prisma from "@/lib/prisma";

/**
 * GET /api/skills/pending-approval
 * Fetch skills pending approval (admin only)
 */
export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    // Check admin role
    const dbUser = await prisma.user.findUnique({ where: { id: user.user_id } });
    if (dbUser?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get skills from Redis that need approval
    const allSkillIds = await redis.smembers("skills:all");
    const pendingSkills = [];

    for (const skillId of allSkillIds) {
      const meta = await redis.hgetall(`skill:meta:${skillId}`);
      // Filter for stable/beta skills - these are candidates for approval
      if (meta && (meta.status === "beta" || meta.status === "stable")) {
        pendingSkills.push({
          skill_id: skillId,
          name: meta.name || skillId,
          category: meta.category || "Uncategorized",
          difficulty_level: meta.difficulty_level || "intermediate",
          status: meta.status || "beta",
          rating: parseFloat(meta.rating || "0"),
          total_reviews: parseInt(meta.total_reviews || "0"),
          total_enrolled: parseInt(meta.total_enrolled || "0"),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: pendingSkills,
      total: pendingSkills.length,
    });
  } catch (error) {
    console.error("Error fetching pending skills:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pending skills" },
      { status: 500 }
    );
  }
});
