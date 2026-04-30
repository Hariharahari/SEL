import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/withAuth';
import { rejectAgent } from '@/lib/agentWorkflow';

export const POST = withAdmin(async (request: NextRequest, { params, user }) => {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const rejectionReason = typeof body?.rejectionReason === 'string' ? body.rejectionReason : '';

  try {
    const rejectedAgent = await rejectAgent(id, user.user_id, rejectionReason);
    return NextResponse.json({
      success: true,
      message: `${rejectedAgent?.agent.name || id} rejected`,
      data: rejectedAgent,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reject agent' },
      { status: 400 }
    );
  }
});
