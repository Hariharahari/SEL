import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import redis from "@/lib/redis";
import prisma from "@/lib/prisma";
import { StoredSkillCard } from "@/lib/skillSchema";
import { z } from "zod";

const FeedbackSchema = z.object({
  rating:   z.number().int().min(1).max(5),
  feedback: z.string().min(1, "Feedback is required"),
});

// submit feedback
export const POST = withAuth(async (req: NextRequest, { user, params }) => {
  const { id, version } = await params;

  // 1. validate body
  const body   = await req.json();
  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // 2. check skill exists and is approved
  const data = await redis.get(`skill:${id}:${version}`);
  if (!data) {
    return NextResponse.json(
      { error: `Skill ${id} version ${version} not found` },
      { status: 404 }
    );
  }

  const skill = JSON.parse(data) as StoredSkillCard;
  if (!skill.is_approved) {
    return NextResponse.json(
      { error: "Cannot submit feedback for unapproved skill" },
      { status: 403 }
    );
  }

  // 3. check user has downloaded this skill first
  const download = await prisma.skillDownload.findUnique({
    where: {
      userId_skillId_version: {
        userId:  user.user_id,
        skillId: id,
        version,
      },
    },
  });

  if (!download) {
    return NextResponse.json(
      { error: "You must download the skill before submitting feedback" },
      { status: 403 }
    );
  }

  // 4. upsert feedback
  const result = await prisma.skillFeedback.upsert({
    where: {
      userId_skillId_version: {
        userId:  user.user_id,
        skillId: id,
        version,
      },
    },
    update: {
      rating:   parsed.data.rating,
      feedback: parsed.data.feedback,
    },
    create: {
      userId:   user.user_id,
      skillId:  id,
      version,
      rating:   parsed.data.rating,
      feedback: parsed.data.feedback,
    },
  });

  return NextResponse.json({
    success: true,
    message: "Feedback submitted successfully",
    data:    result,
  });
});

// get feedback + average rating
export const GET = withAuth(async (_req: NextRequest, { params }) => {
  const { id, version } = await params;

  // 1. get all feedback for this skill version
  const feedbacks = await prisma.skillFeedback.findMany({
    where:   { skillId: id, version },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, email: true },
      },
    },
  });

  // 2. calculate average rating
  const average = await prisma.skillFeedback.aggregate({
    where:  { skillId: id, version },
    _avg:   { rating: true },
    _count: true,
  });

  return NextResponse.json({
    skillId:        id,
    version,
    average_rating: average._avg.rating ?? 0,
    total_feedback: average._count,
    feedbacks,
  });
});