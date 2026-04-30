import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/withAuth';
import { getAgentAnalytics } from '@/lib/agentWorkflow';

export const GET = withAdmin(async () => {
  const analytics = await getAgentAnalytics();
  return NextResponse.json({ data: analytics });
});
