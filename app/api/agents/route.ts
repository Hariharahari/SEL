/**
 * API Route for Agent Management
 * Handles POST requests to upload/save new agents to Redis
 */

import { NextRequest, NextResponse } from 'next/server';
import { saveAgent } from '@/lib/agentStore';
import { SELAgentCard } from '@/types';

/**
 * POST /api/agents
 * Accepts a JSON body containing a SELAgentCard object
 * Validates and saves it to Redis
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body['agent id'] || typeof body['agent id'] !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "agent id" field' },
        { status: 400 }
      );
    }

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "name" field' },
        { status: 400 }
      );
    }

    // Cast to SELAgentCard type (basic validation)
    const agent: SELAgentCard = body;

    // Save to Redis
    const success = await saveAgent(agent);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save agent to database' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Agent "${agent.name}" uploaded successfully`,
        agentId: agent['agent id'],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/agents:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
