import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/withAuth';
import { getAdminHistory } from '@/lib/agentWorkflow';

const ALLOWED_KINDS = new Set(['approved', 'pending', 'rejected', 'downloads']);

export const GET = withAdmin(async (_request, { params }) => {
  const { kind } = await params;

  if (!ALLOWED_KINDS.has(kind)) {
    return NextResponse.json({ error: 'Unsupported history kind' }, { status: 400 });
  }

  const data = await getAdminHistory(kind as 'approved' | 'pending' | 'rejected' | 'downloads');
  return NextResponse.json({ data });
});
