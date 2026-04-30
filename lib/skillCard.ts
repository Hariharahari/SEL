import type { SELAgentCard, SkillCardPayload, SkillUploadEnvelope } from '@/types';

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

export function normalizeSkillUploadPayload(payload: unknown): {
  skillCard: SkillCardPayload;
  agentCard: SELAgentCard;
} {
  const raw = isObject(payload) && isObject(payload.skill_card) ? payload.skill_card : payload;

  if (!isObject(raw)) {
    throw new Error('Upload payload must be a JSON object.');
  }

  if (typeof raw.starterkit_id !== 'string' || !raw.starterkit_id.trim()) {
    throw new Error('Missing or invalid "skill_card.starterkit_id" field.');
  }

  if (typeof raw.name !== 'string' || !raw.name.trim()) {
    throw new Error('Missing or invalid "skill_card.name" field.');
  }

  if (typeof raw.description !== 'string' || !raw.description.trim()) {
    throw new Error('Missing or invalid "skill_card.description" field.');
  }

  if (!isObject(raw.origin) || typeof raw.origin.org !== 'string' || !raw.origin.org.trim()) {
    throw new Error('Missing or invalid "skill_card.origin.org" field.');
  }

  if (!Array.isArray(raw.maintainers)) {
    throw new Error('Missing or invalid "skill_card.maintainers" field.');
  }

  if (typeof raw.version !== 'string' || !raw.version.trim()) {
    throw new Error('Missing or invalid "skill_card.version" field.');
  }

  if (!isStringArray(raw.technology)) {
    throw new Error('Missing or invalid "skill_card.technology" field.');
  }

  if (!isObject(raw.specialization) || typeof raw.specialization.primary !== 'string') {
    throw new Error('Missing or invalid "skill_card.specialization.primary" field.');
  }

  if (!Array.isArray(raw.tasks)) {
    throw new Error('Missing or invalid "skill_card.tasks" field.');
  }

  if (
    !isObject(raw.documentation) ||
    typeof raw.documentation.readme !== 'string' ||
    typeof raw.documentation.howto !== 'string'
  ) {
    throw new Error('Missing or invalid "skill_card.documentation" field.');
  }

  if (!isStringArray(raw.supported_harness)) {
    throw new Error('Missing or invalid "skill_card.supported_harness" field.');
  }

  const status = typeof raw.status === 'string' ? raw.status.trim().toLowerCase() : 'stable';
  const normalizedStatus = status === 'verified' ? 'verified' : status;

  const skillCard: SkillCardPayload = {
    starterkit_id: raw.starterkit_id.trim(),
    name: raw.name.trim(),
    description: raw.description.trim(),
    origin: {
      org: String(raw.origin.org).trim(),
      sub_org: typeof raw.origin.sub_org === 'string' ? raw.origin.sub_org.trim() : undefined,
      creator: typeof raw.origin.creator === 'string' ? raw.origin.creator.trim() : undefined,
    },
    maintainers: raw.maintainers.map((entry) => {
      const item = isObject(entry) ? entry : {};
      return {
        name: typeof item.name === 'string' ? item.name.trim() : '',
        contact: typeof item.contact === 'string' ? item.contact.trim() : '',
      };
    }),
    version: raw.version.trim(),
    status: normalizedStatus as SkillCardPayload['status'],
    technology: raw.technology.map((entry) => entry.trim()).filter(Boolean),
    specialization: {
      primary: raw.specialization.primary.trim(),
      domain_specific: isStringArray(raw.specialization.domain_specific)
        ? raw.specialization.domain_specific.map((entry) => entry.trim()).filter(Boolean)
        : undefined,
    },
    tasks: raw.tasks.map((entry) => {
      const item = isObject(entry) ? entry : {};
      return {
        name: typeof item.name === 'string' ? item.name.trim() : '',
        description: typeof item.description === 'string' ? item.description.trim() : '',
        input_schema: typeof item.input_schema === 'string' ? item.input_schema : undefined,
        output_schema: typeof item.output_schema === 'string' ? item.output_schema : undefined,
        async: Boolean(item.async),
      };
    }),
    documentation: {
      readme: raw.documentation.readme.trim(),
      howto: raw.documentation.howto.trim(),
      changelog: typeof raw.documentation.changelog === 'string' ? raw.documentation.changelog.trim() : undefined,
    },
    supported_harness: raw.supported_harness.map((entry) => entry.trim()).filter(Boolean),
    github_url: typeof raw.github_url === 'string' ? raw.github_url.trim() : undefined,
    video_url: typeof raw.video_url === 'string' ? raw.video_url.trim() : undefined,
  };

  const agentCard: SELAgentCard = {
    'agent id': skillCard.starterkit_id,
    name: skillCard.name,
    description: skillCard.description,
    origin: skillCard.origin,
    maintainers: skillCard.maintainers,
    version: skillCard.version,
    status: skillCard.status,
    technology: skillCard.technology,
    specialization: {
      primary: skillCard.specialization.primary,
      'domain specific': skillCard.specialization.domain_specific,
    },
    tasks: skillCard.tasks,
    documentation: skillCard.documentation,
    'supported harness': skillCard.supported_harness,
    github_url: skillCard.github_url,
    video_url: skillCard.video_url,
  };

  return { skillCard, agentCard };
}

export function wrapSkillCard(skillCard: SkillCardPayload): SkillUploadEnvelope {
  return { skill_card: skillCard };
}

function splitList(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function buildSkillPayloadFromFormData(formData: FormData) {
  const tasksRaw = String(formData.get('tasksJson') || '[]');
  const maintainersRaw = String(formData.get('maintainersJson') || '[]');

  let tasks: unknown = [];
  let maintainers: unknown = [];

  try {
    tasks = JSON.parse(tasksRaw);
  } catch {
    throw new Error('Tasks JSON is invalid.');
  }

  try {
    maintainers = JSON.parse(maintainersRaw);
  } catch {
    throw new Error('Maintainers JSON is invalid.');
  }

  return {
    skill_card: {
      starterkit_id: String(formData.get('starterkit_id') || '').trim(),
      name: String(formData.get('name') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      origin: {
        org: String(formData.get('origin_org') || '').trim(),
        sub_org: String(formData.get('origin_sub_org') || '').trim() || undefined,
        creator: String(formData.get('origin_creator') || '').trim() || undefined,
      },
      maintainers,
      version: String(formData.get('version') || '').trim(),
      status: String(formData.get('status') || 'stable').trim(),
      technology: splitList(formData.get('technology')),
      specialization: {
        primary: String(formData.get('specialization_primary') || '').trim(),
        domain_specific: splitList(formData.get('specialization_domain_specific')),
      },
      tasks,
      documentation: {
        readme: String(formData.get('documentation_readme') || '').trim(),
        howto: String(formData.get('documentation_howto') || '').trim(),
        changelog: String(formData.get('documentation_changelog') || '').trim() || undefined,
      },
      supported_harness: splitList(formData.get('supported_harness')),
      video_url: String(formData.get('video_url') || '').trim() || undefined,
    },
  };
}
