import fs from 'fs/promises';
import path from 'path';
import Redis from 'ioredis';
import { buildSkillAttachmentFileName } from '../lib/attachmentNaming';

type SubmissionAttachment = {
  name: string;
  relativePath: string;
  mimeType: string;
  size: number;
};

type SkillRecord = {
  'agent id': string;
  status?: string;
  github_url?: string;
  sourceFiles?: SubmissionAttachment[];
};

function buildGithubUrl(skillId: string) {
  return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/tree/${GITHUB_BRANCH}/${skillId}`;
}

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_OWNER = process.env.GITHUB_SKILLS_REPO_OWNER || process.env.GITHUB_REPO_OWNER || 'Hariharahari';
const GITHUB_REPO = process.env.GITHUB_SKILLS_REPO_NAME || process.env.GITHUB_REPO_NAME || 'Agents';
const GITHUB_BRANCH = process.env.GITHUB_SKILLS_REPO_BRANCH || process.env.GITHUB_REPO_BRANCH || 'main';

function getGithubToken() {
  return (
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_PAT ||
    process.env.GIT_TOKEN ||
    ''
  );
}

function getHeaders() {
  const token = getGithubToken();
  if (!token) {
    throw new Error(`GitHub publishing is not configured for the default repository ${GITHUB_OWNER}/${GITHUB_REPO}.`);
  }

  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };
}

function resolveSubmissionFile(relativePath: string) {
  return path.join(process.cwd(), 'storage', 'skill-submissions', relativePath);
}

async function listDirectory(
  repoPath: string,
  headers: Record<string, string>
): Promise<Array<{ name: string; path: string; type: string }>> {
  const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${repoPath}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
  const response = await fetch(url, { headers });
  if (response.status === 404) return [];
  if (!response.ok) {
    throw new Error(`Failed to list ${repoPath || '/'} (${response.status}): ${await response.text()}`);
  }
  const payload = await response.json();
  return Array.isArray(payload) ? payload : [];
}

async function getExistingSha(repoPath: string, headers: Record<string, string>) {
  const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${repoPath}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
  const response = await fetch(url, { headers });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to inspect ${repoPath} (${response.status}): ${await response.text()}`);
  }
  const payload = await response.json();
  return typeof payload.sha === 'string' ? payload.sha : null;
}

async function putFile(repoPath: string, content: Buffer, headers: Record<string, string>) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const sha = await getExistingSha(repoPath, headers);
    const response = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${repoPath}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `Migrate approved skill file ${repoPath}`,
        content: content.toString('base64'),
        branch: GITHUB_BRANCH,
        ...(sha ? { sha } : {}),
      }),
    });

    if (response.ok) {
      return;
    }

    if (response.status === 409 && attempt < 2) {
      continue;
    }

    throw new Error(`Failed to publish ${repoPath} (${response.status}): ${await response.text()}`);
  }
}

async function deleteFile(repoPath: string, headers: Record<string, string>) {
  const sha = await getExistingSha(repoPath, headers);
  if (!sha) return false;

  const response = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${repoPath}`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({
      message: `Delete legacy skill file ${repoPath}`,
      sha,
      branch: GITHUB_BRANCH,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to delete ${repoPath} (${response.status}): ${await response.text()}`);
  }
  return true;
}

async function deleteDirectoryRecursively(repoPath: string, headers: Record<string, string>) {
  const items = await listDirectory(repoPath, headers);

  for (const item of items) {
    if (item.type === 'dir') {
      await deleteDirectoryRecursively(item.path, headers);
      continue;
    }

    await deleteFile(item.path, headers);
  }
}

function legacyCandidates(skillId: string, attachment: SubmissionAttachment) {
  const normalizedName = buildSkillAttachmentFileName(skillId, attachment.name, attachment.mimeType);
  const candidates = new Set<string>();

  if (attachment.name !== normalizedName) {
    candidates.add(`${skillId}/${attachment.name}`);
  }

  if (normalizedName.endsWith('-agent.md')) {
    candidates.add(`${skillId}/agent.md`);
  }

  if (normalizedName.endsWith('.mp4')) {
    candidates.add(`${skillId}/demo.mp4`);
    candidates.add(`${skillId}/demo-placeholder.mp4`);
  }

  candidates.delete(`${skillId}/${normalizedName}`);
  return [...candidates];
}

async function main() {
  const headers = getHeaders();
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    maxRetriesPerRequest: null,
  });

  try {
    const raw = await redis.hgetall('agents_catalog');
    const migrated: string[] = [];
    const skipped: string[] = [];
    const activeSkillIds = new Set<string>();

    for (const [skillId, payload] of Object.entries(raw)) {
      const skill = JSON.parse(payload) as SkillRecord;
      const attachments = skill.sourceFiles || [];
      if (!attachments.length) {
        skipped.push(skill['agent id']);
        continue;
      }

      const currentSkillId = skill['agent id'];
      activeSkillIds.add(currentSkillId);
      const githubUrl = buildGithubUrl(currentSkillId);

      for (const attachment of attachments) {
        const absolutePath = resolveSubmissionFile(attachment.relativePath);
        const content = await fs.readFile(absolutePath);
        const normalizedName = buildSkillAttachmentFileName(
          currentSkillId,
          attachment.name,
          attachment.mimeType
        );
        await putFile(`${currentSkillId}/${normalizedName}`, content, headers);

        for (const legacyPath of legacyCandidates(currentSkillId, attachment)) {
          await deleteFile(legacyPath, headers);
        }
      }

      const updatedSkill: SkillRecord = {
        ...skill,
        github_url: githubUrl,
      };
      await redis.hset('agents_catalog', skillId, JSON.stringify(updatedSkill));

      const reviewedPayload = await redis.hget('agents_reviewed', currentSkillId);
      if (reviewedPayload) {
        const reviewedRecord = JSON.parse(reviewedPayload) as {
          agent?: SkillRecord;
          status?: string;
        };
        if (reviewedRecord.agent) {
          reviewedRecord.agent = {
            ...reviewedRecord.agent,
            github_url: githubUrl,
          };
          await redis.hset('agents_reviewed', currentSkillId, JSON.stringify(reviewedRecord));
        }
      }

      migrated.push(currentSkillId);
    }

    const rootItems = await listDirectory('', headers);
    const pruned: string[] = [];
    for (const item of rootItems) {
      if (item.type !== 'dir') {
        continue;
      }

      if (activeSkillIds.has(item.name)) {
        continue;
      }

      await deleteDirectoryRecursively(item.path, headers);
      pruned.push(item.name);
    }

    console.log(
      JSON.stringify(
        {
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          branch: GITHUB_BRANCH,
          migrated,
          skipped,
          pruned,
        },
        null,
        2
      )
    );
  } finally {
    redis.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
