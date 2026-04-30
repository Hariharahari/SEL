import 'server-only';

import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import type { SubmissionAttachment } from '@/types';

const SUBMISSION_ROOT = path.join(process.cwd(), 'storage', 'skill-submissions');

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function saveSubmissionFiles(
  skillId: string,
  files: File[]
): Promise<SubmissionAttachment[]> {
  const folderName = `${skillId}-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const targetDir = path.join(SUBMISSION_ROOT, folderName);
  await mkdir(targetDir, { recursive: true });

  const attachments: SubmissionAttachment[] = [];
  for (const file of files) {
    const safeName = sanitizeFileName(file.name);
    const absolutePath = path.join(targetDir, safeName);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, bytes);

    attachments.push({
      name: file.name,
      relativePath: path.join(folderName, safeName).replace(/\\/g, '/'),
      absolutePath,
      mimeType: file.type || 'application/octet-stream',
      size: bytes.byteLength,
    });
  }

  return attachments;
}

export function resolveSubmissionFile(attachment: SubmissionAttachment) {
  if (attachment.absolutePath) {
    return attachment.absolutePath;
  }

  return path.join(SUBMISSION_ROOT, attachment.relativePath);
}
