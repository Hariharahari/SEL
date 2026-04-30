import { readFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/withAuth';
import { getSubmissionById } from '@/lib/agentStore';
import { resolveSubmissionFile } from '@/lib/submissionFiles';

export const GET = withAdmin(async (request: NextRequest, { params }) => {
  const { id } = await params;
  const relativePath = request.nextUrl.searchParams.get('path')?.trim();

  if (!relativePath) {
    return NextResponse.json({ error: 'File path is required' }, { status: 400 });
  }

  const submission = await getSubmissionById(id);
  if (!submission) {
    return NextResponse.json({ error: 'Skill submission not found' }, { status: 404 });
  }

  const attachment = submission.agent.sourceFiles?.find((file) => file.relativePath === relativePath);
  if (!attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
  }

  const absolutePath = resolveSubmissionFile(attachment);
  const fileBuffer = await readFile(absolutePath);
  const isMarkdown = attachment.name.toLowerCase().endsWith('.md');

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': isMarkdown ? 'text/markdown; charset=utf-8' : attachment.mimeType || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${attachment.name}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
});
