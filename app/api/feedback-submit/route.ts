import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';

export interface FeedbackSubmission {
  userId: string;
  agentIds: string[]; // List of agent IDs being rated
  ratings: {
    [agentId: string]: {
      rating: number;
      feedback: string;
    };
  };
  submittedAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, agentIds, ratings } = body;

    if (!userId || !agentIds || !ratings) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store feedback for each agent
    for (const agentId of agentIds) {
      if (ratings[agentId]) {
        const feedbackKey = `feedback:${userId}:${agentId}`;
        const feedbackData = {
          agentId,
          rating: ratings[agentId].rating,
          feedback: ratings[agentId].feedback,
          submittedAt: new Date().toISOString(),
        };

        await redis.set(feedbackKey, JSON.stringify(feedbackData));
        await redis.expire(feedbackKey, 365 * 24 * 60 * 60); // 365 days
      }
    }

    // Mark that feedback was provided for this download cycle
    const userKey = `user:${userId}`;
    const userDataJson = await redis.get(userKey);
    const userData = userDataJson ? JSON.parse(userDataJson) : { downloads: [] };
    const nextDownloadNumber = userData.downloads.length + 1;
    const feedbackMarkerKey = `feedback:${userId}:download-${nextDownloadNumber}`;
    
    await redis.set(feedbackMarkerKey, JSON.stringify({ feedbackAt: new Date().toISOString() }));
    await redis.expire(feedbackMarkerKey, 365 * 24 * 60 * 60);

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
