import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/withAuth';
import { getPendingAgents } from '@/lib/agentStore';

export const GET = withAdmin(async () => {
  const pending = await getPendingAgents();
  return NextResponse.json({ data: pending });
});
