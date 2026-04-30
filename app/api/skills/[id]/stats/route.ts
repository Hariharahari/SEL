import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import redis from "@/lib/redis";
import prisma from "@/lib/prisma";

/**
 * GET /api/skills/[id]/stats
 * Get detailed analytics for a specific skill
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

    // Try to get skill id from params (if available) or fallback to parsing the URL
    let skillId: string | undefined = undefined;
    try {
      // NextRequest may not provide `params` when wrapped by withAuth, so extract from URL
      const urlPath = new URL(req.url).pathname;
      const match = urlPath.match(/\/api\/skills\/([^\/]+)\/stats/);
      if (match && match[1]) skillId = decodeURIComponent(match[1]);
    } catch (e) {
      // ignore and fallback
    }

    if (!skillId) {
      return NextResponse.json(
        { success: false, error: "Skill ID required" },
        { status: 400 }
      );
    }

    // Fetch agent/skill from Redis
    const agentJson = await redis.hget("agents_catalog", skillId);
    if (!agentJson) {
      return NextResponse.json(
        { success: false, error: "Skill not found" },
        { status: 404 }
      );
    }

    let agent;
    try {
      agent = JSON.parse(agentJson);
    } catch (err) {
      return NextResponse.json(
        { success: false, error: "Invalid skill data" },
        { status: 500 }
      );
    }

    // Extract skill info from agent
    const skill = {
      skill_id: skillId,
      name: agent.name || agent['agent name'] || skillId,
      category: agent.category || agent['category'] || "Uncategorized",
      difficulty_level: agent.difficulty_level || agent['difficulty level'] || "intermediate",
      status: agent.status || "stable",
      rating: parseFloat(agent.rating || agent.rating_avg || "0"),
      total_reviews: parseInt(agent.total_reviews || agent.review_count || "0"),
      total_enrolled: parseInt(agent.total_enrolled || agent.enrollment_count || "0"),
    };

    // Get approval status
    const approvalStatus = await redis.hgetall(`skill:approval:${skillId}`);
    
    // Get downloads from database for this skill
    const downloads = await prisma.skillDownload.findMany({
      where: { skillId },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    // Get feedback/reviews for this skill
    const feedbacks = await prisma.skillFeedback.findMany({
      where: { skillId },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    // Calculate derived stats
    const averageRating = feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(2)
      : "0";

    const ratingDistribution = {
      5: feedbacks.filter(f => f.rating === 5).length,
      4: feedbacks.filter(f => f.rating === 4).length,
      3: feedbacks.filter(f => f.rating === 3).length,
      2: feedbacks.filter(f => f.rating === 2).length,
      1: feedbacks.filter(f => f.rating === 1).length,
    };

    const purposeBreakdown = downloads.reduce((acc: Record<string, number>, d) => {
      acc[d.purpose || "Not specified"] = (acc[d.purpose || "Not specified"] || 0) + 1;
      return acc;
    }, {});

    const uniqueUsers = new Set(downloads.map(d => d.userId)).size;

    // Get approval history
    const approvalHistory = approvalStatus ? {
      status: approvalStatus.status || "pending",
      approved_by: approvalStatus.approved_by || null,
      approved_at: approvalStatus.approved_at || null,
      rejected_by: approvalStatus.rejected_by || null,
      rejected_at: approvalStatus.rejected_at || null,
      reason: approvalStatus.reason || null,
    } : {
      status: "pending",
      approved_by: null,
      approved_at: null,
      rejected_by: null,
      rejected_at: null,
      reason: null,
    };

    return NextResponse.json({
      success: true,
      data: {
        skill,
        engagement: {
          total_downloads: downloads.length,
          unique_downloaders: uniqueUsers,
          total_reviews: feedbacks.length,
          average_rating: parseFloat(averageRating),
          rating_distribution: ratingDistribution,
          purpose_breakdown: purposeBreakdown,
        },
        approval: approvalHistory,
        recent_downloads: downloads.slice(-10).reverse().map(d => ({
          user_id: d.userId,
          user_email: d.user.email,
          purpose: d.purpose,
          downloaded_at: d.downloadedAt,
        })),
        recent_reviews: feedbacks.slice(-10).reverse().map(f => ({
          user_id: f.userId,
          user_email: f.user.email,
          rating: f.rating,
          feedback: f.feedback,
          created_at: f.createdAt,
        })),
        stats: {
          engagement_score: ((downloads.length + feedbacks.length) / (uniqueUsers || 1) * 10).toFixed(2),
          completion_ratio: (parseFloat((skill.total_reviews || 0) as any) / (downloads.length || 1) * 100).toFixed(2),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching skill stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch skill stats" },
      { status: 500 }
    );
  }
});
