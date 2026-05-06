import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/withAuth';
import { getSubmissionById } from '@/lib/agentStore';
import { submitAgent } from '@/lib/agentWorkflow';
import {
  buildSkillPayloadFromFormData,
  buildSkillPayloadFromJsonText,
  normalizeSkillUploadPayload,
} from '@/lib/skillCard';
import { saveSubmissionFiles } from '@/lib/submissionFiles';
import {
  getSkillAttachmentSlot,
  isSkillMarkdownAttachment,
} from '@/lib/attachmentNaming';
import type { SubmissionAttachment } from '@/types';
import { generateAgentMdReview } from '@/lib/agentMdReview';

function mergeSubmissionFiles(existingFiles: SubmissionAttachment[], newFiles: SubmissionAttachment[]) {
  const mergedFiles = [...existingFiles];

  for (const newFile of newFiles) {
    const newSlot = getSkillAttachmentSlot(newFile.name, newFile.mimeType);

    if (newSlot) {
      for (let index = mergedFiles.length - 1; index >= 0; index -= 1) {
        const existingSlot = getSkillAttachmentSlot(
          mergedFiles[index].name,
          mergedFiles[index].mimeType
        );
        if (existingSlot === newSlot) {
          mergedFiles.splice(index, 1);
        }
      }
    } else {
      const duplicateIndex = mergedFiles.findIndex(
        (existingFile) => existingFile.name.toLowerCase() === newFile.name.toLowerCase()
      );
      if (duplicateIndex >= 0) {
        mergedFiles.splice(duplicateIndex, 1);
      }
    }

    mergedFiles.push(newFile);
  }

  return mergedFiles;
}

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
      const jsonPayload = formData.get('jsonPayload');
      body =
        typeof jsonPayload === 'string' && jsonPayload.trim()
          ? buildSkillPayloadFromJsonText(jsonPayload)
          : buildSkillPayloadFromFormData(formData);
    } else {
      body = await request.json();
    }

    const { skillCard, agentCard } = normalizeSkillUploadPayload(body);
    const newSourceFiles =
      attachments.length > 0 ? await saveSubmissionFiles(skillCard.starterkit_id, attachments) : [];
    const combinedSourceFiles = mergeSubmissionFiles(
      submission.agent.sourceFiles || [],
      newSourceFiles
    );
    const markdownFiles = combinedSourceFiles.filter((file) => isSkillMarkdownAttachment(file.name));

    if (markdownFiles.length !== 1) {
      return NextResponse.json(
        { error: 'Exactly one markdown prompt file must exist for the skill submission.' },
        { status: 400 }
      );
    }

    agentCard['agent id'] = submission.agent['agent id'];
    agentCard.sourceFiles = combinedSourceFiles;
    agentCard.agentMdReview = (await generateAgentMdReview(agentCard)) || undefined;

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
