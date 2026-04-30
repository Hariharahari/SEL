import { NextRequest, NextResponse } from 'next/server';
import { semanticSearchAgents } from '@/lib/agentWorkflow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid query. Please provide a valid string.' },
        { status: 400 }
      );
    }

    const results = await semanticSearchAgents(query);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in AI search API:', error);
    return NextResponse.json(
      { error: 'Failed to process search request' },
      { status: 500 }
    );
  }
}
