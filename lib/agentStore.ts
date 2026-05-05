import 'server-only';
import redis from './redis';
import type { AgentAnalysis, SELAgentCard } from '@/types';
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
  reviewComment?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  embeddingProvider?: string;
  analysis?: AgentAnalysis;
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
  const record: AgentSubmissionRecord = {
    agent,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    submittedBy,
  };

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
  return updatedAgent;
}

export async function getAgentCount(): Promise<number> {
  return redis.hlen(LIVE_AGENTS_HASH_KEY);
}
