import 'server-only';

import { readFile } from 'fs/promises';
import { resolveSubmissionFile } from './submissionFiles';
import type { SELAgentCard, SubmissionAttachment } from '@/types';
import { buildSkillAttachmentFileName } from './attachmentNaming';

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
    throw new Error(
      `GitHub publishing is not configured for the default repository ${GITHUB_OWNER}/${GITHUB_REPO}.`
    );
  }

  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };
}

async function getExistingSha(repoPath: string, headers: Record<string, string>) {
  const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${repoPath}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
  const response = await fetch(url, { headers });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Failed to inspect existing GitHub file (${response.status}): ${payload}`);
  }

  const payload = await response.json();
  return typeof payload.sha === 'string' ? payload.sha : null;
}

async function deleteGithubFile(
  repoPath: string,
  headers: Record<string, string>,
  message: string
) {
  const sha = await getExistingSha(repoPath, headers);
  if (!sha) {
    return false;
  }

  const response = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${repoPath}`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({
      message,
      sha,
      branch: GITHUB_BRANCH,
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Failed to delete legacy GitHub file ${repoPath} (${response.status}): ${payload}`);
  }

  return true;
}

function buildLegacyRepoPaths(skillId: string, attachment: SubmissionAttachment) {
  const originalName = attachment.name.trim();
  const normalizedName = buildSkillAttachmentFileName(skillId, attachment.name, attachment.mimeType);
  const paths = new Set<string>();

  if (originalName && originalName !== normalizedName) {
    paths.add(`${skillId}/${originalName}`);
  }

  if (attachment.mimeType.toLowerCase().startsWith('video/') || originalName.toLowerCase().endsWith('.mp4')) {
    paths.add(`${skillId}/demo-placeholder.mp4`);
    paths.add(`${skillId}/demo.mp4`);
  }

  if (originalName.toLowerCase().endsWith('.md') || normalizedName.endsWith('-agent.md')) {
    paths.add(`${skillId}/agent.md`);
  }

  paths.delete(`${skillId}/${normalizedName}`);
  return Array.from(paths);
}

export async function publishSkillFilesToGithub(
  skillId: string,
  attachments: SubmissionAttachment[]
) {
  const token = getGithubToken();
  if (!token) {
    return {
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      branch: GITHUB_BRANCH,
      url: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/tree/${GITHUB_BRANCH}/${skillId}`,
      published: false,
    };
  }

  const headers = getHeaders();

  for (const attachment of attachments) {
    const absolutePath = resolveSubmissionFile(attachment);
    const content = await readFile(absolutePath);
    const normalizedRepoFileName = buildSkillAttachmentFileName(
      skillId,
      attachment.name,
      attachment.mimeType
    );
    const repoPath = `${skillId}/${normalizedRepoFileName}`;
    const sha = await getExistingSha(repoPath, headers);

    const response = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${repoPath}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `Publish approved skill ${skillId}: ${normalizedRepoFileName}`,
        content: content.toString('base64'),
        branch: GITHUB_BRANCH,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!response.ok) {
      const payload = await response.text();
      throw new Error(
        `Failed to publish ${attachment.name} to ${GITHUB_OWNER}/${GITHUB_REPO} (${response.status}): ${payload}`
      );
    }

    const legacyPaths = buildLegacyRepoPaths(skillId, attachment);
    for (const legacyPath of legacyPaths) {
      await deleteGithubFile(
        legacyPath,
        headers,
        `Remove legacy skill file for ${skillId}: ${legacyPath.split('/').pop()}`
      );
    }
  }

  return {
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    branch: GITHUB_BRANCH,
    url: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/tree/${GITHUB_BRANCH}/${skillId}`,
    published: true,
  };
}

export async function migrateApprovedSkillGithubFiles(skills: SELAgentCard[]) {
  const token = getGithubToken();
  if (!token) {
    throw new Error(`GitHub publishing is not configured for the default repository ${GITHUB_OWNER}/${GITHUB_REPO}.`);
  }

  const migrated: string[] = [];
  const skipped: string[] = [];

  for (const skill of skills) {
    if (!skill.sourceFiles?.length) {
      skipped.push(skill['agent id']);
      continue;
    }

    await publishSkillFilesToGithub(skill['agent id'], skill.sourceFiles);
    migrated.push(skill['agent id']);
  }

  return {
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    branch: GITHUB_BRANCH,
    migrated,
    skipped,
  };
}
