import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';

interface FeedbackPayload {
  agentId: string;
  feature: string;
  rating: number;
  comment: string;
  email?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackPayload = await request.json();

    // Validate input
    if (!body.agentId || !body.feature || body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: 'Invalid feedback data' },
        { status: 400 }
      );
    }

    // Create feedback entry
    const feedbackId = `feedback:${body.agentId}:${Date.now()}`;
    const feedbackData = {
      agentId: body.agentId,
      feature: body.feature,
      rating: body.rating,
      comment: body.comment,
      email: body.email || 'anonymous',
      timestamp: new Date().toISOString(),
      id: feedbackId,
    };

    // Store in Redis
    // 1. Store individual feedback
    await redis.hset('agent:feedbacks', feedbackId, JSON.stringify(feedbackData));

    // 2. Store feedback by agent (for retrieval)
    await redis.lpush(`agent:${body.agentId}:feedbacks`, feedbackId);

    // 3. Store feedback statistics
    const statsKey = `agent:${body.agentId}:feedback:stats`;
    await redis.hincrby(statsKey, `rating:${body.rating}`, 1);
    await redis.hincrby(statsKey, 'total_feedback', 1);
    await redis.hset(
      statsKey,
      'last_feedback',
      new Date().toISOString()
    );

    // 4. Index by feature for analysis
    await redis.sadd(`feedback:features`, body.feature);
    await redis.lpush(`feedback:feature:${body.feature}`, feedbackId);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Feedback submitted successfully',
        feedbackId
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve feedback for an agent
export async function GET(request: NextRequest) {
  try {
    const agentId = request.nextUrl.searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID required' },
        { status: 400 }
      );
    }

    // Get feedback IDs for this agent
    const feedbackIds = await redis.lrange(`agent:${agentId}:feedbacks`, 0, -1);

    if (feedbackIds.length === 0) {
      return NextResponse.json({
        feedbacks: [],
        stats: { totalFeedback: 0, averageRating: 0 },
      });
    }

    // Get feedback details
    const feedbacks = [];
    for (const feedbackId of feedbackIds) {
      const feedbackJson = await redis.hget('agent:feedbacks', feedbackId);
      if (feedbackJson) {
        try {
          feedbacks.push(JSON.parse(feedbackJson));
        } catch (e) {
          console.error('Error parsing feedback:', e);
        }
      }
    }

    // Calculate stats
    const statsKey = `agent:${agentId}:feedback:stats`;
    const stats = await redis.hgetall(statsKey);

    const totalFeedback = parseInt(stats.total_feedback || '0');
    let totalRating = 0;
    for (let i = 1; i <= 5; i++) {
      totalRating += i * parseInt(stats[`rating:${i}`] || '0');
    }
    const averageRating = totalFeedback > 0 ? (totalRating / totalFeedback).toFixed(1) : 0;

    return NextResponse.json({
      feedbacks: feedbacks.slice(0, 10), // Return latest 10
      stats: {
        totalFeedback,
        averageRating,
        ratingDistribution: {
          '5star': parseInt(stats['rating:5'] || '0'),
          '4star': parseInt(stats['rating:4'] || '0'),
          '3star': parseInt(stats['rating:3'] || '0'),
          '2star': parseInt(stats['rating:2'] || '0'),
          '1star': parseInt(stats['rating:1'] || '0'),
        },
      },
    });
  } catch (error) {
    console.error('Error retrieving feedback:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feedback' },
      { status: 500 }
    );
  }
}
