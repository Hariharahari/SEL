import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import redis from "@/lib/redis";
import prisma from "@/lib/prisma";

/**
 * GET /api/skills/browse
 * Get all skills for admin browsing and selection
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

    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.toLowerCase() || "";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    // Get all agents from Redis (agents_catalog hash)
    const allAgents = await redis.hgetall("agents_catalog");

    if (!allAgents || Object.keys(allAgents).length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          skills: [],
          total: 0,
          page,
          limit,
          total_pages: 0,
        },
      });
    }

    // Convert agents to skills format
    const skills: any[] = [];
    const categories = new Set<string>();

    for (const [agentId, agentJson] of Object.entries(allAgents)) {
      try {
        const agent = JSON.parse(agentJson);
        
        // Extract skill info from agent
        const skillName = agent.name || agent['agent name'] || agentId;
        const skillCategory = agent.category || agent['category'] || "Uncategorized";
        const skillDifficulty = agent.difficulty_level || agent['difficulty level'] || "intermediate";
        const skillStatus = agent.status || "stable";
        const skillRating = parseFloat(agent.rating || agent.rating_avg || "0");
        const skillReviews = parseInt(agent.total_reviews || agent.review_count || "0");
        const skillEnrolled = parseInt(agent.total_enrolled || agent.enrollment_count || "0");

        categories.add(skillCategory);

        // Apply filters
        if (category && skillCategory !== category) continue;
        if (difficulty && skillDifficulty !== difficulty) continue;
        if (status && skillStatus !== status) continue;
        if (search && !(
          skillName.toLowerCase().includes(search) ||
          skillCategory.toLowerCase().includes(search)
        )) continue;

        skills.push({
          skill_id: agentId,
          name: skillName,
          category: skillCategory,
          difficulty_level: skillDifficulty,
          status: skillStatus,
          rating: skillRating,
          total_reviews: skillReviews,
          total_enrolled: skillEnrolled,
        });
      } catch (err) {
        console.error(`Error parsing agent ${agentId}:`, err);
        continue;
      }
    }

    // Sort by enrollment (most popular first)
    skills.sort((a, b) => b.total_enrolled - a.total_enrolled);

    // Pagination
    const total = skills.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedSkills = skills.slice(start, end);

    return NextResponse.json({
      success: true,
      data: {
        skills: paginatedSkills,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
        filters_available: {
          categories: Array.from(categories).sort(),
          difficulties: ["beginner", "intermediate", "advanced", "expert"],
          statuses: ["alpha", "beta", "rc", "stable", "deprecated"],
        },
      },
    });
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
});
