import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/withAuth';
import { getSubmissionsForUser } from '@/lib/agentStore';

export const GET = withAuth(async (_request, { user }) => {
  const submissions = await getSubmissionsForUser(user.user_id);
  return NextResponse.json({ data: submissions });
});
