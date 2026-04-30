import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/withAuth';
import { getSubmissionById } from '@/lib/agentStore';
import { submitAgent } from '@/lib/agentWorkflow';
import { buildSkillPayloadFromFormData, normalizeSkillUploadPayload } from '@/lib/skillCard';
import { saveSubmissionFiles } from '@/lib/submissionFiles';

export const PATCH = withAuth(async (request: NextRequest, { user, params }) => {
  const { id } = await params;
  const submission = await getSubmissionById(id);

  if (!submission || submission.submittedBy !== user.user_id) {
    return NextResponse.json({ error: 'Skill submission not found' }, { status: 404 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let body: unknown;
    let attachments: File[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      attachments = formData
        .getAll('attachments')
        .filter((entry): entry is File => entry instanceof File && entry.size > 0);
      body = buildSkillPayloadFromFormData(formData);
    } else {
      body = await request.json();
    }

    const { skillCard, agentCard } = normalizeSkillUploadPayload(body);
    const newSourceFiles =
      attachments.length > 0 ? await saveSubmissionFiles(skillCard.starterkit_id, attachments) : [];
    const combinedSourceFiles = [...(submission.agent.sourceFiles || []), ...newSourceFiles];

    if (!combinedSourceFiles.some((file) => file.name.toLowerCase() === 'agent.md')) {
      return NextResponse.json(
        { error: 'agent.md is mandatory for every skill submission.' },
        { status: 400 }
      );
    }

    agentCard['agent id'] = submission.agent['agent id'];
    agentCard.sourceFiles = combinedSourceFiles;

    await submitAgent(agentCard, user.user_id);

    return NextResponse.json({
      success: true,
      message: `Skill "${agentCard.name}" updated and resubmitted for admin approval`,
      skillId: agentCard['agent id'],
      status: 'pending',
    });
  } catch (error) {
    console.error('Error in PATCH /api/user/submissions/[id]:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
