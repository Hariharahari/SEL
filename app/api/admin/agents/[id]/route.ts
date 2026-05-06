import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/withAuth';
import {
  getAgentById,
  getSubmissionById,
  setAgentActiveState,
  setSubmissionAgentMdReview,
} from '@/lib/agentStore';
import { removeAgentFromSearchIndex } from '@/lib/agentWorkflow';
import { generateAgentMdReview } from '@/lib/agentMdReview';

export const GET = withAdmin(async (_request, { params }) => {
  const { id } = await params;
  let submission = await getSubmissionById(id);

  if (!submission) {
    return NextResponse.json({ error: 'Skill submission not found' }, { status: 404 });
  }

  if (
    !submission.agent.agentMdReview ||
    typeof submission.agent.agentMdReview.overallRating !== 'number' ||
    typeof submission.agent.agentMdReview.overallScore !== 'number' ||
    submission.agent.agentMdReview.model === 'deterministic-rules'
  ) {
    const report = await generateAgentMdReview(submission.agent);
    if (report) {
      submission = (await setSubmissionAgentMdReview(id, report)) || {
        ...submission,
        agent: {
          ...submission.agent,
          agentMdReview: report,
        },
      };
    }
  }

  return NextResponse.json({ data: submission });
});

export const DELETE = withAdmin(async (_request, { params }) => {
  const { id } = await params;
  const approvedSkill = await getAgentById(id);

  if (!approvedSkill) {
    return NextResponse.json({ error: 'Approved skill not found' }, { status: 404 });
  }

  await setAgentActiveState(id, false);
  await removeAgentFromSearchIndex(id);

  return NextResponse.json({
    success: true,
    message: `Approved skill "${approvedSkill.name}" has been marked inactive.`,
  });
});
