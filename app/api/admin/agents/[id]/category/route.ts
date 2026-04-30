import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/withAuth';
import { getAgentById, saveApprovedAgent } from '@/lib/agentStore';

export const PATCH = withAdmin(async (request: NextRequest, { params }) => {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const categoryOverride = typeof body?.categoryOverride === 'string' ? body.categoryOverride.trim() : '';
  const subcategoryOverride = typeof body?.subcategoryOverride === 'string' ? body.subcategoryOverride.trim() : '';

  const agent = await getAgentById(id);
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const updatedAgent = {
    ...agent,
    categoryOverride: categoryOverride || undefined,
    subcategoryOverride: subcategoryOverride || undefined,
  };

  await saveApprovedAgent(updatedAgent);

  return NextResponse.json({
    success: true,
    data: updatedAgent,
  });
});
