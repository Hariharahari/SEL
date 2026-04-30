import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/withAuth';
import { getAgentAnalyticsDetail } from '@/lib/agentWorkflow';

export const GET = withAdmin(async (_req, { params }) => {
  const { id } = await params;
  const analytics = await getAgentAnalyticsDetail(id);

  if (!analytics) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  return NextResponse.json({ data: analytics });
});
