import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/withAuth';
import { submitAgent } from '@/lib/agentWorkflow';
import { ensurePortalUser } from '@/lib/userSync';
import {
  buildSkillPayloadFromFormData,
  buildSkillPayloadFromJsonText,
  normalizeSkillUploadPayload,
} from '@/lib/skillCard';
import { saveSubmissionFiles } from '@/lib/submissionFiles';

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    await ensurePortalUser(user);
    const contentType = request.headers.get('content-type') || '';
    let body: unknown;
    let attachments: File[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      attachments = formData
        .getAll('attachments')
        .filter((entry): entry is File => entry instanceof File && entry.size > 0);

      if (!attachments.some((file) => file.name.toLowerCase() === 'agent.md')) {
        return NextResponse.json(
          { error: 'agent.md is mandatory for every skill submission.' },
          { status: 400 }
        );
      }

      const jsonPayload = formData.get('jsonPayload');
      body =
        typeof jsonPayload === 'string' && jsonPayload.trim()
          ? buildSkillPayloadFromJsonText(jsonPayload)
          : buildSkillPayloadFromFormData(formData);
    } else {
      body = await request.json();
    }

    const { skillCard, agentCard } = normalizeSkillUploadPayload(body);
    if (attachments.length > 0) {
      agentCard.sourceFiles = await saveSubmissionFiles(skillCard.starterkit_id, attachments);
    }
    await submitAgent(agentCard, user.user_id);

    return NextResponse.json(
      {
        success: true,
        message: `Skill "${skillCard.name}" submitted for admin approval`,
        skillId: skillCard.starterkit_id,
        status: 'pending',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/agents:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
