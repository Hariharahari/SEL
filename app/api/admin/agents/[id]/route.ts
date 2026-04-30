import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/withAuth';
import { getSubmissionById } from '@/lib/agentStore';

export const GET = withAdmin(async (_request, { params }) => {
  const { id } = await params;
  const submission = await getSubmissionById(id);

  if (!submission) {
    return NextResponse.json({ error: 'Skill submission not found' }, { status: 404 });
  }

  return NextResponse.json({ data: submission });
});
