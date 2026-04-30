import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import redis from "@/lib/redis";
import prisma from "@/lib/prisma";

/**
 * GET /api/analytics/skills
 * Get analytics about skills (admin dashboard)
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

    // Get stats from Redis
    const allSkillIds = await redis.smembers("skills:all");
    const approvedSkills = await redis.smembers("skills:approved");
    const rejectedSkills = await redis.smembers("skills:rejected");
    const pendingSkills = await redis.smembers("skills:pending");

    // Get category breakdown
    const categories = new Map<string, number>();
    const difficulties = new Map<string, number>();
    const statuses = new Map<string, number>();

    let totalEnrolled = 0;
    let totalRating = 0;
    let ratingCount = 0;
    let totalDownloads = 0;

    for (const skillId of allSkillIds) {
      const meta = await redis.hgetall(`skill:meta:${skillId}`);

      if (meta) {
        // Category stats
        const category = meta.category || "Uncategorized";
        categories.set(category, (categories.get(category) || 0) + 1);

        // Difficulty stats
        const difficulty = meta.difficulty_level || "intermediate";
        difficulties.set(difficulty, (difficulties.get(difficulty) || 0) + 1);

        // Status stats
        const status = meta.status || "stable";
        statuses.set(status, (statuses.get(status) || 0) + 1);

        // Aggregate metrics
        totalEnrolled += parseInt(meta.total_enrolled || "0");
        totalRating += parseFloat(meta.rating || "0");
        ratingCount++;
      }
    }

    // Get user count from database
    const totalUsers = await prisma.user.count();
    const adminUsers = await prisma.user.count({ where: { role: "ADMIN" } });
    const regularUsers = totalUsers - adminUsers;

    // Get downloads from database
    const downloads = await prisma.skillDownload.count();

    return NextResponse.json({
      success: true,
      data: {
        skills: {
          total: allSkillIds.length,
          approved: approvedSkills.length,
          rejected: rejectedSkills.length,
          pending: pendingSkills.length,
          average_rating: ratingCount > 0 ? (totalRating / ratingCount).toFixed(2) : "0",
          total_enrolled: totalEnrolled,
          total_downloads: downloads,
        },
        categories: Object.fromEntries(categories),
        difficulties: Object.fromEntries(difficulties),
        statuses: Object.fromEntries(statuses),
        users: {
          total: totalUsers,
          admins: adminUsers,
          regular: regularUsers,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
});
