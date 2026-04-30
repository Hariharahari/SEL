import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/withAuth';
import { approveAgent } from '@/lib/agentWorkflow';

export const POST = withAdmin(async (request: NextRequest, { params, user }) => {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reviewComment = typeof body?.reviewComment === 'string' ? body.reviewComment : undefined;

  try {
    const approvedAgent = await approveAgent(id, user.user_id, reviewComment);
    return NextResponse.json({
      success: true,
      message: `${approvedAgent.name} approved and added to Redis plus vector search`,
      data: approvedAgent,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to approve agent' },
      { status: 400 }
    );
  }
});
