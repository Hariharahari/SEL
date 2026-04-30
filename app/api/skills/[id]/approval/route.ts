import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import redis from "@/lib/redis";
import prisma from "@/lib/prisma";
import { z } from "zod";

const ApprovalSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

/**
 * POST /api/skills/:id/approval
 * Approve or reject a skill (admin only)
 */
export const POST = withAuth(
  async (req: NextRequest, { user, params }) => {
    try {
      // Check admin role
      const dbUser = await prisma.user.findUnique({ where: { id: user.user_id } });
      if (dbUser?.role !== "ADMIN") {
        return NextResponse.json(
          { success: false, error: "Admin access required" },
          { status: 403 }
        );
      }

      const skillId = params.id;
      const body = ApprovalSchema.parse(await req.json());

      // Fetch skill from Redis
      const skillYaml = await redis.get(`skill:${skillId}`);
      if (!skillYaml) {
        return NextResponse.json(
          { success: false, error: "Skill not found" },
          { status: 404 }
        );
      }

      // Update approval status in Redis
      if (body.action === "approve") {
        await redis.hset(`skill:approval:${skillId}`, {
          status: "approved",
          approved_by: user.user_id,
          approved_at: new Date().toISOString(),
          reason: body.reason || "Approved by admin",
        });
        await redis.sadd("skills:approved", skillId);
        await redis.srem("skills:pending", skillId);
      } else {
        await redis.hset(`skill:approval:${skillId}`, {
          status: "rejected",
          rejected_by: user.user_id,
          rejected_at: new Date().toISOString(),
          reason: body.reason || "Rejected by admin",
        });
        await redis.sadd("skills:rejected", skillId);
        await redis.srem("skills:pending", skillId);
      }

      return NextResponse.json({
        success: true,
        message: `Skill ${body.action}ed successfully`,
        data: {
          skill_id: skillId,
          action: body.action,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error processing skill approval:", error);
      return NextResponse.json(
        { success: false, error: "Failed to process approval" },
        { status: 500 }
      );
    }
  }
);
