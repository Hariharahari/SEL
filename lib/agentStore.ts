import 'server-only';
import redis from './redis';
import type {
  AgentAnalysis,
  SELAgentCard,
  SubmissionActivityLogEntry,
} from '@/types';
import { removeVectorRecord } from './faiss';

const LIVE_AGENTS_HASH_KEY = 'agents_catalog';
const PENDING_AGENTS_HASH_KEY = 'agents_pending';
const REVIEWED_AGENTS_HASH_KEY = 'agents_reviewed';

export type AgentWorkflowStatus = 'pending' | 'approved' | 'rejected';

export interface AgentSubmissionRecord {
  agent: SELAgentCard;
  status: AgentWorkflowStatus;
  submittedAt: string;
  submittedBy?: string;
  revision: number;
  activityLog: SubmissionActivityLogEntry[];
  reviewComment?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  embeddingProvider?: string;
  analysis?: AgentAnalysis;
}

function buildActivityEntry(
  entry: Omit<SubmissionActivityLogEntry, 'timestamp'> & { timestamp?: string }
): SubmissionActivityLogEntry {
  return {
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
  };
}

async function updateSubmissionRecord(
  hashKey: string,
  agentId: string,
  updater: (record: AgentSubmissionRecord) => AgentSubmissionRecord
): Promise<AgentSubmissionRecord | null> {
  const payload = await redis.hget(hashKey, agentId);
  if (!payload) {
    return null;
  }

  const record = JSON.parse(payload) as AgentSubmissionRecord;
  const updatedRecord = updater(record);
  await redis.hset(hashKey, agentId, JSON.stringify(updatedRecord));
  return updatedRecord;
}

async function parseHashValues<T>(hashKey: string): Promise<T[]> {
  const records = await redis.hgetall(hashKey);
  if (!records || Object.keys(records).length === 0) {
    return [];
  }

  return Object.values(records)
    .map((item) => {
      try {
        return JSON.parse(item) as T;
      } catch (error) {
        console.error(`Failed to parse Redis payload from ${hashKey}:`, error);
        return null;
      }
    })
    .filter((item): item is T => item !== null);
}

function isAgentActive(agent: SELAgentCard) {
  return agent.isActive !== false;
}

function isManualUploadedAgent(agent: SELAgentCard) {
  return agent.ingestionSource === 'manual-upload' || Boolean(agent.sourceFiles?.length);
}

async function hydrateLegacyManualAgent(agent: SELAgentCard) {
  if (agent.ingestionSource || !isManualUploadedAgent(agent)) {
    return agent;
  }

  const upgradedAgent: SELAgentCard = {
    ...agent,
    ingestionSource: 'manual-upload',
  };
  await saveApprovedAgent(upgradedAgent);
  return upgradedAgent;
}

export async function purgeLegacyCatalogAgents(): Promise<string[]> {
  const catalog = await parseHashValues<SELAgentCard>(LIVE_AGENTS_HASH_KEY);
  const removedIds: string[] = [];

  for (const agent of catalog) {
    if (isManualUploadedAgent(agent)) {
      if (!agent.ingestionSource) {
        await hydrateLegacyManualAgent(agent);
      }
      continue;
    }

    removedIds.push(agent['agent id']);
    await redis.hdel(LIVE_AGENTS_HASH_KEY, agent['agent id']);
    await removeVectorRecord(agent['agent id']);
  }

  return removedIds;
}

export async function getAllAgents(): Promise<SELAgentCard[]> {
  await purgeLegacyCatalogAgents();
  const agents = await parseHashValues<SELAgentCard>(LIVE_AGENTS_HASH_KEY);
  return agents.filter((agent) => isAgentActive(agent) && isManualUploadedAgent(agent));
}

export async function getAllCatalogAgents(): Promise<SELAgentCard[]> {
  await purgeLegacyCatalogAgents();
  const agents = await parseHashValues<SELAgentCard>(LIVE_AGENTS_HASH_KEY);
  return agents.filter(isManualUploadedAgent);
}

export async function getAgentById(agentId: string): Promise<SELAgentCard | null> {
  const payload = await redis.hget(LIVE_AGENTS_HASH_KEY, agentId);
  return payload ? (JSON.parse(payload) as SELAgentCard) : null;
}

export async function saveApprovedAgent(agent: SELAgentCard): Promise<void> {
  await redis.hset(LIVE_AGENTS_HASH_KEY, agent['agent id'], JSON.stringify(agent));
}

export async function saveAgent(agent: SELAgentCard): Promise<boolean> {
  await saveApprovedAgent(agent);
  return true;
}

export async function submitAgentForApproval(
  agent: SELAgentCard,
  submittedBy?: string
): Promise<AgentSubmissionRecord> {
  const existingRecord =
    (await getPendingAgentById(agent['agent id'])) || (await getReviewedAgentById(agent['agent id']));
  const isResubmission = Boolean(existingRecord);
  const revision = (existingRecord?.revision || 0) + 1;
  const activityLog = [
    ...(existingRecord?.activityLog || []),
    buildActivityEntry({
      type: isResubmission ? 'resubmitted' : 'submitted',
      actorId: submittedBy,
      note: isResubmission
        ? 'Skill was edited and sent back for admin review.'
        : 'Skill was submitted for admin review.',
      sourceFileNames: agent.sourceFiles?.map((file) => file.name) || [],
      status: 'pending',
      revision,
    }),
  ];
  const record: AgentSubmissionRecord = {
    agent: {
      ...agent,
      agentMdReview: undefined,
    },
    status: 'pending',
    submittedAt: new Date().toISOString(),
    submittedBy: submittedBy || existingRecord?.submittedBy,
    revision,
    activityLog,
  };

  await redis.hdel(REVIEWED_AGENTS_HASH_KEY, agent['agent id']);
  await redis.hset(PENDING_AGENTS_HASH_KEY, agent['agent id'], JSON.stringify(record));
  return record;
}

export async function getPendingAgentById(agentId: string): Promise<AgentSubmissionRecord | null> {
  const payload = await redis.hget(PENDING_AGENTS_HASH_KEY, agentId);
  return payload ? (JSON.parse(payload) as AgentSubmissionRecord) : null;
}

export async function getReviewedAgentById(agentId: string): Promise<AgentSubmissionRecord | null> {
  const payload = await redis.hget(REVIEWED_AGENTS_HASH_KEY, agentId);
  return payload ? (JSON.parse(payload) as AgentSubmissionRecord) : null;
}

export async function getPendingAgents(): Promise<AgentSubmissionRecord[]> {
  const records = await parseHashValues<AgentSubmissionRecord>(PENDING_AGENTS_HASH_KEY);
  return records.sort((left, right) => right.submittedAt.localeCompare(left.submittedAt));
}

export async function getReviewedAgents(): Promise<AgentSubmissionRecord[]> {
  const records = await parseHashValues<AgentSubmissionRecord>(REVIEWED_AGENTS_HASH_KEY);
  return records.sort((left, right) => {
    const leftDate = left.approvedAt || left.rejectedAt || left.submittedAt;
    const rightDate = right.approvedAt || right.rejectedAt || right.submittedAt;
    return rightDate.localeCompare(leftDate);
  });
}

export async function getSubmissionById(agentId: string): Promise<AgentSubmissionRecord | null> {
  return (await getPendingAgentById(agentId)) || (await getReviewedAgentById(agentId));
}

export async function setSubmissionAgentMdReview(
  agentId: string,
  report: NonNullable<SELAgentCard['agentMdReview']>
): Promise<AgentSubmissionRecord | null> {
  const pendingUpdated = await updateSubmissionRecord(PENDING_AGENTS_HASH_KEY, agentId, (record) => ({
    ...record,
    agent: {
      ...record.agent,
      agentMdReview: report,
    },
  }));
  if (pendingUpdated) {
    return pendingUpdated;
  }

  return updateSubmissionRecord(REVIEWED_AGENTS_HASH_KEY, agentId, (record) => ({
    ...record,
    agent: {
      ...record.agent,
      agentMdReview: report,
    },
  }));
}

export async function getSubmissionsForUser(userId: string): Promise<AgentSubmissionRecord[]> {
  const [pending, reviewed] = await Promise.all([getPendingAgents(), getReviewedAgents()]);
  return [...pending, ...reviewed]
    .filter((record) => record.submittedBy === userId)
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt));
}

export async function markAgentApproved(
  agentId: string,
  approvedAgent: SELAgentCard,
  options: {
    approvedBy: string;
    reviewComment?: string;
    embeddingProvider?: string;
    analysis?: AgentAnalysis;
  }
): Promise<AgentSubmissionRecord | null> {
  const pendingRecord = await getPendingAgentById(agentId);
  if (!pendingRecord) {
    return null;
  }

  const approvedRecord: AgentSubmissionRecord = {
    ...pendingRecord,
    agent: approvedAgent,
    status: 'approved',
    reviewComment: options.reviewComment,
    approvedAt: new Date().toISOString(),
    approvedBy: options.approvedBy,
    embeddingProvider: options.embeddingProvider,
    analysis: options.analysis,
    activityLog: [
      ...(pendingRecord.activityLog || []),
      buildActivityEntry({
        type: 'approved',
        actorId: options.approvedBy,
        note: options.reviewComment?.trim() || 'Skill was approved and published.',
        status: 'approved',
        revision: pendingRecord.revision,
      }),
    ],
  };

  await saveApprovedAgent(approvedAgent);
  await redis.hdel(PENDING_AGENTS_HASH_KEY, agentId);
  await redis.hset(REVIEWED_AGENTS_HASH_KEY, agentId, JSON.stringify(approvedRecord));
  return approvedRecord;
}

export async function markAgentRejected(
  agentId: string,
  rejectedBy: string,
  rejectionReason: string
): Promise<AgentSubmissionRecord | null> {
  const pendingRecord = await getPendingAgentById(agentId);
  if (!pendingRecord) {
    return null;
  }

  const rejectedRecord: AgentSubmissionRecord = {
    ...pendingRecord,
    status: 'rejected',
    rejectedAt: new Date().toISOString(),
    rejectedBy,
    rejectionReason,
    activityLog: [
      ...(pendingRecord.activityLog || []),
      buildActivityEntry({
        type: 'rejected',
        actorId: rejectedBy,
        note: rejectionReason,
        status: 'rejected',
        revision: pendingRecord.revision,
      }),
    ],
  };

  await redis.hdel(PENDING_AGENTS_HASH_KEY, agentId);
  await redis.hset(REVIEWED_AGENTS_HASH_KEY, agentId, JSON.stringify(rejectedRecord));
  return rejectedRecord;
}

export async function deleteAgent(agentId: string): Promise<boolean> {
  const result = await redis.hdel(LIVE_AGENTS_HASH_KEY, agentId);
  return result > 0;
}

export async function setAgentActiveState(agentId: string, isActive: boolean): Promise<SELAgentCard | null> {
  const agent = await getAgentById(agentId);
  if (!agent) {
    return null;
  }

  const updatedAgent: SELAgentCard = {
    ...agent,
    isActive,
    inactiveAt: isActive ? undefined : new Date().toISOString(),
  };

  await saveApprovedAgent(updatedAgent);
  await updateSubmissionRecord(REVIEWED_AGENTS_HASH_KEY, agentId, (record) => ({
    ...record,
    agent: updatedAgent,
    activityLog: [
      ...(record.activityLog || []),
      buildActivityEntry({
        type: isActive ? 'reactivated' : 'inactivated',
        note: isActive
          ? 'Skill was returned to the live catalog.'
          : 'Skill was removed from the live catalog and marked inactive.',
        status: record.status,
        revision: record.revision,
      }),
    ],
  }));
  return updatedAgent;
}

export async function getAgentCount(): Promise<number> {
  return redis.hlen(LIVE_AGENTS_HASH_KEY);
}
