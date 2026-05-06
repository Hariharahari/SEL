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
import { isSkillMarkdownAttachment } from '@/lib/attachmentNaming';
import { generateAgentMdReview } from '@/lib/agentMdReview';

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

      const markdownAttachments = attachments.filter((file) => file.name.toLowerCase().endsWith('.md'));
      if (markdownAttachments.length === 0) {
        return NextResponse.json(
          { error: 'A markdown agent file is mandatory for every skill submission.' },
          { status: 400 }
        );
      }
      if (markdownAttachments.length > 1) {
        return NextResponse.json(
          { error: 'Submit exactly one markdown prompt file for the skill.' },
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
      if (!agentCard.sourceFiles.some((file) => isSkillMarkdownAttachment(file.name))) {
        return NextResponse.json(
          { error: `The agent markdown file must be stored as "${skillCard.starterkit_id}-agent.md".` },
          { status: 400 }
        );
      }
    }
    agentCard.agentMdReview = (await generateAgentMdReview(agentCard)) || undefined;
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
