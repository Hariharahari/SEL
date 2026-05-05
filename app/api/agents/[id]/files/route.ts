import { readFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/withAuth';
import { getAgentById } from '@/lib/agentStore';
import { resolveSubmissionFile } from '@/lib/submissionFiles';

export const GET = withAuth(async (request: NextRequest, { params }) => {
  const { id } = await params;
  const relativePath = request.nextUrl.searchParams.get('path')?.trim();

  if (!relativePath) {
    return NextResponse.json({ error: 'File path is required' }, { status: 400 });
  }

  const agent = await getAgentById(id);
  if (!agent) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

  const attachment = agent.sourceFiles?.find((file) => file.relativePath === relativePath);
  if (!attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
  }

  const absolutePath = resolveSubmissionFile(attachment);
  const fileBuffer = await readFile(absolutePath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': attachment.mimeType || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${attachment.name}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
});
