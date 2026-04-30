import prisma from '@/lib/prisma';
import type { Downloads, SELAgentCard } from '@/types';
import redis from '@/lib/redis';
import {
  getAgentById,
  getAllAgents,
  getPendingAgentById,
  getPendingAgents,
  getReviewedAgents,
  markAgentApproved,
  markAgentRejected,
  saveApprovedAgent,
  submitAgentForApproval,
} from './agentStore';
import { generateEmbedding } from './embeddings';
import { generateAgentAnalysis, hasNvidiaAccess, suggestAgentCategory } from './nvidia';
import { removeVectorRecord, searchVectorIndex, upsertVectorRecord } from './faiss';
import { publishSkillFilesToGithub } from './githubSkills';

function startOfDaysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export function buildAgentEmbeddingText(agent: SELAgentCard) {
  return [
    `Name: ${agent.name}`,
    `Description: ${agent.description}`,
    `Organization: ${agent.origin.org}`,
    `Status: ${agent.status}`,
    `Version: ${agent.version}`,
    `Technologies: ${agent.technology.join(', ')}`,
    `Primary specialization: ${agent.specialization.primary}`,
    `Domain specific: ${(agent.specialization['domain specific'] || []).join(', ')}`,
    `Tasks: ${agent.tasks.map((task) => `${task.name} - ${task.description}`).join('; ')}`,
    `Documentation: ${agent.documentation.readme} ${agent.documentation.howto} ${agent.documentation.changelog || ''}`,
  ].join('\n');
}

async function getAgentDownloadStats(agentId: string, version: string): Promise<Downloads> {
  const [total, last7Days, last30Days, latest] = await Promise.all([
    prisma.skillDownload.count({
      where: { skillId: agentId, version },
    }),
    prisma.skillDownload.count({
      where: {
        skillId: agentId,
        version,
        downloadedAt: { gte: startOfDaysAgo(7) },
      },
    }),
    prisma.skillDownload.count({
      where: {
        skillId: agentId,
        version,
        downloadedAt: { gte: startOfDaysAgo(30) },
      },
    }),
    prisma.skillDownload.findFirst({
      where: { skillId: agentId, version },
      orderBy: { downloadedAt: 'desc' },
    }),
  ]);

  return {
    last_downloaded: latest?.downloadedAt.toISOString() || 'Not downloaded yet',
    total_download_7_days: last7Days,
    total_download_30_days: last30Days,
    total_download_overall: total,
  };
}

export async function syncAgentDownloads(agent: SELAgentCard): Promise<SELAgentCard> {
  const downloads = await getAgentDownloadStats(agent['agent id'], agent.version);
  const updatedAgent: SELAgentCard = {
    ...agent,
    downloads,
  };

  await saveApprovedAgent(updatedAgent);
  return updatedAgent;
}

export async function submitAgent(agent: SELAgentCard, submittedBy?: string) {
  return submitAgentForApproval(agent, submittedBy);
}

export async function approveAgent(agentId: string, approvedBy: string, reviewComment?: string) {
  const pending = await getPendingAgentById(agentId);
  if (!pending) {
    throw new Error('Pending agent not found');
  }

  if (!pending.agent.sourceFiles || pending.agent.sourceFiles.length === 0) {
    throw new Error('Pending skill is missing uploaded source files.');
  }

  const embeddingText = buildAgentEmbeddingText(pending.agent);
  const embedding = await generateEmbedding(embeddingText);
  const downloads = await getAgentDownloadStats(pending.agent['agent id'], pending.agent.version);
  const statsForAnalysis = {
    totalDownloads: downloads.total_download_overall,
    weeklyDownloads: downloads.total_download_7_days,
    monthlyDownloads: downloads.total_download_30_days,
    lastDownloaded:
      downloads.last_downloaded === 'Not downloaded yet' ? null : downloads.last_downloaded,
  };
  const [analysis, suggestedCategory] = await Promise.all([
    generateAgentAnalysis(pending.agent, statsForAnalysis),
    suggestAgentCategory(pending.agent),
  ]);
  const publishedRepo = await publishSkillFilesToGithub(
    pending.agent['agent id'],
    pending.agent.sourceFiles
  );

  const approvedAgent: SELAgentCard = {
    ...pending.agent,
    downloads,
    analysis,
    categoryOverride: suggestedCategory.category,
    subcategoryOverride: suggestedCategory.subcategory,
    github_url: publishedRepo.published ? publishedRepo.url : undefined,
  };

  await upsertVectorRecord({
    id: approvedAgent['agent id'],
    kind: 'agent',
    name: approvedAgent.name,
    version: approvedAgent.version,
    status: approvedAgent.status,
    text: embeddingText,
    embedding,
    updatedAt: new Date().toISOString(),
  });

  await markAgentApproved(agentId, approvedAgent, {
    approvedBy,
    reviewComment,
    embeddingProvider: hasNvidiaAccess() ? 'nvidia' : 'local-fallback',
    analysis,
  });

  return approvedAgent;
}

export async function rejectAgent(agentId: string, rejectedBy: string, rejectionReason: string) {
  if (!rejectionReason.trim()) {
    throw new Error('Rejection reason is required');
  }

  return markAgentRejected(agentId, rejectedBy, rejectionReason.trim());
}

export async function recordAgentDownload(
  agentId: string,
  version: string,
  userId: string,
  purpose = 'agent_download'
) {
  await prisma.skillDownload.upsert({
    where: {
      userId_skillId_version: {
        userId,
        skillId: agentId,
        version,
      },
    },
    update: {
      downloadedAt: new Date(),
      purpose,
    },
    create: {
      userId,
      skillId: agentId,
      version,
      purpose,
    },
  });

  const agent = await getAgentById(agentId);
  if (agent) {
    await syncAgentDownloads(agent);
  }
}

export async function semanticSearchAgents(query: string, limit = 12) {
  const approvedAgents = await getAllAgents();
  if (!approvedAgents.length) {
    return [];
  }

  const queryEmbedding = await generateEmbedding(query);
  const ranked = await searchVectorIndex(queryEmbedding, limit * 2);

  const approvedById = new Map(approvedAgents.map((agent) => [agent['agent id'], agent]));
  const fromVector = ranked
    .map((item) => ({
      agent: approvedById.get(item.id),
      similarity: item.similarity,
    }))
    .filter((item): item is { agent: SELAgentCard; similarity: number } => Boolean(item.agent));

  const normalizedQuery = query.trim().toLowerCase();
  const vectorMatches = fromVector.filter((item) => item.similarity >= 0.58);
  if (vectorMatches.length > 0) {
    return vectorMatches.slice(0, limit);
  }

  const lowerQuery = normalizedQuery;
  return approvedAgents
    .filter((agent) =>
      `${agent.name} ${agent.description} ${agent.specialization.primary} ${agent.technology.join(' ')} ${agent.categoryOverride || ''} ${agent.subcategoryOverride || ''}`
        .toLowerCase()
        .includes(lowerQuery)
    )
    .slice(0, limit)
    .map((agent) => ({ agent, similarity: 0.4 }));
}

export async function getAgentAnalytics() {
  const [approvedAgents, pendingAgents, reviewedAgents] = await Promise.all([
    getAllAgents(),
    getPendingAgents(),
    getReviewedAgents(),
  ]);

  const approvedWithStats = await Promise.all(approvedAgents.map((agent) => syncAgentDownloads(agent)));

  const totals = approvedWithStats.reduce(
    (accumulator, agent) => {
      accumulator.totalDownloads += agent.downloads?.total_download_overall || 0;
      accumulator.last7Days += agent.downloads?.total_download_7_days || 0;
      accumulator.last30Days += agent.downloads?.total_download_30_days || 0;
      return accumulator;
    },
    { totalDownloads: 0, last7Days: 0, last30Days: 0 }
  );

  return {
    summary: {
      approved: approvedWithStats.length,
      pending: pendingAgents.length,
      rejected: reviewedAgents.filter((record) => record.status === 'rejected').length,
      totalDownloads: totals.totalDownloads,
      downloadsLast7Days: totals.last7Days,
      downloadsLast30Days: totals.last30Days,
    },
    pending: pendingAgents,
    approved: approvedWithStats,
    reviewed: reviewedAgents,
  };
}

export async function removeAgentFromSearchIndex(agentId: string) {
  await removeVectorRecord(agentId);
}

export async function getAgentDownloadStatsExtended(agentId: string, version: string) {
  const [overall, last7Days, last30Days, last365Days, latest] = await Promise.all([
    prisma.skillDownload.count({
      where: { skillId: agentId, version },
    }),
    prisma.skillDownload.count({
      where: { skillId: agentId, version, downloadedAt: { gte: startOfDaysAgo(7) } },
    }),
    prisma.skillDownload.count({
      where: { skillId: agentId, version, downloadedAt: { gte: startOfDaysAgo(30) } },
    }),
    prisma.skillDownload.count({
      where: { skillId: agentId, version, downloadedAt: { gte: startOfDaysAgo(365) } },
    }),
    prisma.skillDownload.findFirst({
      where: { skillId: agentId, version },
      orderBy: { downloadedAt: 'desc' },
    }),
  ]);

  return {
    overall,
    last7Days,
    last30Days,
    last365Days,
    lastDownloaded: latest?.downloadedAt.toISOString() || null,
  };
}

export async function getAgentFeedbackStats(agentId: string) {
  const feedbackIds = await redis.lrange(`agent:${agentId}:feedbacks`, 0, 9);
  const stats = await redis.hgetall(`agent:${agentId}:feedback:stats`);

  const feedbacks = [];
  for (const feedbackId of feedbackIds) {
    const payload = await redis.hget('agent:feedbacks', feedbackId);
    if (!payload) continue;
    try {
      feedbacks.push(JSON.parse(payload));
    } catch (error) {
      console.error('Failed to parse feedback payload:', error);
    }
  }

  const totalFeedback = Number(stats.total_feedback || 0);
  let totalWeighted = 0;
  for (let rating = 1; rating <= 5; rating += 1) {
    totalWeighted += rating * Number(stats[`rating:${rating}`] || 0);
  }

  return {
    totalFeedback,
    averageRating: totalFeedback ? Number((totalWeighted / totalFeedback).toFixed(1)) : 0,
    distribution: {
      5: Number(stats['rating:5'] || 0),
      4: Number(stats['rating:4'] || 0),
      3: Number(stats['rating:3'] || 0),
      2: Number(stats['rating:2'] || 0),
      1: Number(stats['rating:1'] || 0),
    },
    feedbacks,
    lastFeedback: stats.last_feedback || null,
  };
}

export async function getAgentAnalyticsDetail(agentId: string) {
  const agent = await getAgentById(agentId);
  if (!agent) {
    return null;
  }

  const [downloadStats, feedbackStats] = await Promise.all([
    getAgentDownloadStatsExtended(agent['agent id'], agent.version),
    getAgentFeedbackStats(agent['agent id']),
  ]);

  return {
    agent,
    downloads: downloadStats,
    feedback: feedbackStats,
  };
}

export async function getAdminHistory(kind: 'approved' | 'pending' | 'rejected' | 'downloads') {
  if (kind === 'approved') {
    const approved = await getAllAgents();
    return Promise.all(
      approved.map(async (agent) => ({
        agent: await syncAgentDownloads(agent),
      }))
    );
  }

  if (kind === 'pending') {
    return getPendingAgents();
  }

  if (kind === 'rejected') {
    const reviewed = await getReviewedAgents();
    return reviewed.filter((record) => record.status === 'rejected');
  }

  const downloads = await prisma.skillDownload.findMany({
    orderBy: { downloadedAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          businessGroup: true,
          IOU: true,
          account: true,
        },
      },
    },
    take: 250,
  });

  const approvedAgents = await getAllAgents();
  const nameById = new Map(approvedAgents.map((agent) => [agent['agent id'], agent.name]));

  return downloads.map((entry) => ({
    skillId: entry.skillId,
    skillName: nameById.get(entry.skillId) || entry.skillId,
    version: entry.version,
    purpose: entry.purpose,
    downloadedAt: entry.downloadedAt.toISOString(),
    user: entry.user,
  }));
}
