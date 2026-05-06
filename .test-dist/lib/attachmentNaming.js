"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeAttachmentFileName = sanitizeAttachmentFileName;
exports.buildSkillAttachmentFileName = buildSkillAttachmentFileName;
exports.isSkillMarkdownAttachment = isSkillMarkdownAttachment;
exports.isSkillVideoAttachment = isSkillVideoAttachment;
exports.getSkillAttachmentSlot = getSkillAttachmentSlot;
function sanitizeAttachmentFileName(fileName) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}
function buildSkillAttachmentFileName(skillId, fileName, mimeType = '') {
    const safeSkillId = sanitizeAttachmentFileName(skillId.trim().toLowerCase());
    const lowerName = fileName.trim().toLowerCase();
    const lowerMimeType = mimeType.toLowerCase();
    if (lowerName.endsWith('.md')) {
        return `${safeSkillId}-agent.md`;
    }
    if (lowerMimeType.startsWith('video/') ||
        lowerName.endsWith('.mp4') ||
        lowerName.endsWith('.mov') ||
        lowerName.endsWith('.webm')) {
        return `${safeSkillId}.mp4`;
    }
    return sanitizeAttachmentFileName(fileName);
}
function isSkillMarkdownAttachment(fileName) {
    const lowerName = fileName.trim().toLowerCase();
    return lowerName === 'agent.md' || lowerName.endsWith('-agent.md');
}
function isSkillVideoAttachment(fileName, mimeType = '') {
    const lowerName = fileName.trim().toLowerCase();
    const lowerMimeType = mimeType.toLowerCase();
    return (lowerMimeType.startsWith('video/') ||
        lowerName.endsWith('.mp4') ||
        lowerName.endsWith('.mov') ||
        lowerName.endsWith('.webm'));
}
function getSkillAttachmentSlot(fileName, mimeType = '') {
    if (isSkillMarkdownAttachment(fileName)) {
        return 'markdown';
    }
    if (isSkillVideoAttachment(fileName, mimeType)) {
        return 'video';
    }
    return null;
}
//# sourceMappingURL=attachmentNaming.js.map