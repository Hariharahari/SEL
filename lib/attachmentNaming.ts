export function sanitizeAttachmentFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function buildSkillAttachmentFileName(skillId: string, fileName: string, mimeType = '') {
  const safeSkillId = sanitizeAttachmentFileName(skillId.trim().toLowerCase());
  const lowerName = fileName.trim().toLowerCase();
  const lowerMimeType = mimeType.toLowerCase();

  if (lowerName.endsWith('.md')) {
    return `${safeSkillId}-agent.md`;
  }

  if (
    lowerMimeType.startsWith('video/') ||
    lowerName.endsWith('.mp4') ||
    lowerName.endsWith('.mov') ||
    lowerName.endsWith('.webm')
  ) {
    return `${safeSkillId}.mp4`;
  }

  return sanitizeAttachmentFileName(fileName);
}

export function isSkillMarkdownAttachment(fileName: string) {
  const lowerName = fileName.trim().toLowerCase();
  return lowerName === 'agent.md' || lowerName.endsWith('-agent.md');
}

export function isSkillVideoAttachment(fileName: string, mimeType = '') {
  const lowerName = fileName.trim().toLowerCase();
  const lowerMimeType = mimeType.toLowerCase();

  return (
    lowerMimeType.startsWith('video/') ||
    lowerName.endsWith('.mp4') ||
    lowerName.endsWith('.mov') ||
    lowerName.endsWith('.webm')
  );
}

export function getSkillAttachmentSlot(fileName: string, mimeType = '') {
  if (isSkillMarkdownAttachment(fileName)) {
    return 'markdown' as const;
  }

  if (isSkillVideoAttachment(fileName, mimeType)) {
    return 'video' as const;
  }

  return null;
}
