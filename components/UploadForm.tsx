'use client';

import {
  AlertCircle,
  Braces,
  CheckCircle,
  FileText,
  PencilLine,
  Plus,
  RefreshCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { tokenStorage } from '@/lib/auth';
import { SKILL_ID_PATTERN, wrapSkillCard } from '@/lib/skillCard';
import type {
  SELAgentCard,
  SkillCardPayload,
  SubmissionAttachment,
} from '@/types';

type MaintainerInput = {
  name: string;
  contact: string;
};

type TaskInput = {
  name: string;
  description: string;
  async: boolean;
};

type UploadMode = 'form' | 'json';

export interface EditableSubmissionRecord {
  agent: SELAgentCard;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  rejectionReason?: string;
}

interface UploadFormProps {
  editingSubmission?: EditableSubmissionRecord | null;
  onSubmitted?: () => void;
  onCancelEdit?: () => void;
}

const STATUS_OPTIONS = ['alpha', 'beta', 'rc', 'stable', 'deprecated', 'verified'] as const;

const emptyForm = {
  starterkit_id: '',
  name: '',
  description: '',
  origin_org: '',
  origin_sub_org: '',
  origin_creator: '',
  version: '',
  status: 'verified' as (typeof STATUS_OPTIONS)[number],
  technology: '',
  specialization_primary: '',
  specialization_domain_specific: '',
  documentation_readme: '',
  documentation_howto: '',
  documentation_changelog: '',
  supported_harness: '',
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toCommaList(values?: string[]) {
  return (values || []).join(', ');
}

function buildSkillCardFromFormState(
  form: typeof emptyForm,
  maintainers: MaintainerInput[],
  tasks: TaskInput[]
): SkillCardPayload {
  return {
    starterkit_id: form.starterkit_id.trim(),
    name: form.name.trim(),
    description: form.description.trim(),
    origin: {
      org: form.origin_org.trim(),
      sub_org: form.origin_sub_org.trim() || undefined,
      creator: form.origin_creator.trim(),
    },
    maintainers: maintainers.map((item) => ({
      name: item.name.trim(),
      contact: item.contact.trim(),
    })),
    version: form.version.trim(),
    status: form.status,
    technology: form.technology
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
    specialization: {
      primary: form.specialization_primary.trim(),
      domain_specific: form.specialization_domain_specific
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
    },
    tasks: tasks.map((task) => ({
      name: task.name.trim(),
      description: task.description.trim(),
      async: task.async,
    })),
    documentation: {
      readme: form.documentation_readme.trim(),
      howto: form.documentation_howto.trim(),
      changelog: form.documentation_changelog.trim() || undefined,
    },
    supported_harness: form.supported_harness
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  };
}

function buildJsonTemplate(
  form: typeof emptyForm,
  maintainers: MaintainerInput[],
  tasks: TaskInput[]
) {
  return JSON.stringify(
    wrapSkillCard(buildSkillCardFromFormState(form, maintainers, tasks)),
    null,
    2
  );
}

function buildJsonTemplateFromAgent(agent: SELAgentCard) {
  return JSON.stringify(
    {
      skill_card: {
        starterkit_id: agent['agent id'],
        name: agent.name,
        description: agent.description,
        origin: {
          org: agent.origin.org,
          sub_org: agent.origin.sub_org,
          creator: agent.origin.creator,
        },
        maintainers: agent.maintainers,
        version: agent.version,
        status: agent.status,
        technology: agent.technology,
        specialization: {
          primary: agent.specialization.primary,
          domain_specific: agent.specialization['domain specific'] || [],
        },
        tasks: agent.tasks.map((task) => ({
          name: task.name,
          description: task.description,
          async: task.async,
        })),
        documentation: agent.documentation,
        supported_harness: agent['supported harness'],
      },
    },
    null,
    2
  );
}

function mergeFiles(current: File[], incoming: File[]) {
  const byName = new Map<string, File>();
  for (const file of current) {
    byName.set(file.name.toLowerCase(), file);
  }
  for (const file of incoming) {
    byName.set(file.name.toLowerCase(), file);
  }
  return Array.from(byName.values());
}

export default function UploadForm({
  editingSubmission = null,
  onSubmitted,
  onCancelEdit,
}: UploadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [uploadMode, setUploadMode] = useState<UploadMode>('form');
  const [jsonPayload, setJsonPayload] = useState(
    buildJsonTemplate(emptyForm, [{ name: '', contact: '' }], [{ name: '', description: '', async: false }])
  );
  const [jsonFileName, setJsonFileName] = useState('');
  const [jsonFileInputKey, setJsonFileInputKey] = useState(0);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<SubmissionAttachment[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [maintainers, setMaintainers] = useState<MaintainerInput[]>([{ name: '', contact: '' }]);
  const [tasks, setTasks] = useState<TaskInput[]>([{ name: '', description: '', async: false }]);

  useEffect(() => {
    if (!editingSubmission) {
      const initialMaintainers = [{ name: '', contact: '' }];
      const initialTasks = [{ name: '', description: '', async: false }];
      setForm(emptyForm);
      setMaintainers(initialMaintainers);
      setTasks(initialTasks);
      setJsonPayload(buildJsonTemplate(emptyForm, initialMaintainers, initialTasks));
      setExistingFiles([]);
      setAttachments([]);
      setFileInputKey((value) => value + 1);
      setStatus('idle');
      setMessage('');
      setUploadMode('form');
      setJsonFileName('');
      setJsonFileInputKey((value) => value + 1);
      return;
    }

    const { agent } = editingSubmission;
    const nextForm = {
      starterkit_id: agent['agent id'],
      name: agent.name,
      description: agent.description,
      origin_org: agent.origin.org,
      origin_sub_org: agent.origin.sub_org || '',
      origin_creator: agent.origin.creator || '',
      version: agent.version,
      status: agent.status,
      technology: toCommaList(agent.technology),
      specialization_primary: agent.specialization.primary,
      specialization_domain_specific: toCommaList(agent.specialization['domain specific']),
      documentation_readme: agent.documentation.readme,
      documentation_howto: agent.documentation.howto,
      documentation_changelog: agent.documentation.changelog || '',
      supported_harness: toCommaList(agent['supported harness']),
    };
    const nextMaintainers =
      agent.maintainers.length
        ? agent.maintainers.map((item) => ({ name: item.name, contact: item.contact }))
        : [{ name: '', contact: '' }];
    const nextTasks =
      agent.tasks.length
        ? agent.tasks.map((item) => ({
            name: item.name,
            description: item.description,
            async: item.async,
          }))
        : [{ name: '', description: '', async: false }];

    setForm(nextForm);
    setMaintainers(nextMaintainers);
    setTasks(nextTasks);
    setJsonPayload(buildJsonTemplateFromAgent(agent));
    setExistingFiles(agent.sourceFiles || []);
    setAttachments([]);
    setFileInputKey((value) => value + 1);
    setStatus('idle');
    setMessage('');
    setJsonFileName('');
    setJsonFileInputKey((value) => value + 1);
  }, [editingSubmission]);

  const hasAgentMd = useMemo(() => {
    const currentAttachments = attachments.some((file) => file.name.toLowerCase() === 'agent.md');
    const currentExisting = existingFiles.some((file) => file.name.toLowerCase() === 'agent.md');
    return currentAttachments || currentExisting;
  }, [attachments, existingFiles]);

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validateFormMode = () => {
    if (!form.starterkit_id.trim()) return 'Skill ID is required.';
    if (!SKILL_ID_PATTERN.test(form.starterkit_id.trim())) {
      return 'Skill ID must use lowercase letters, numbers, and hyphens only. Spaces are not allowed.';
    }
    if (!form.name.trim()) return 'Skill name is required.';
    if (!form.description.trim()) return 'Description is required.';
    if (!form.origin_org.trim()) return 'Origin organization is required.';
    if (!form.origin_creator.trim()) return 'Creator is required.';
    if (!form.version.trim()) return 'Version is required.';
    if (!form.technology.trim()) return 'Technology is required.';
    if (!form.specialization_primary.trim()) return 'Primary specialization is required.';
    if (!form.documentation_readme.trim()) return 'README URL is required.';
    if (!form.documentation_howto.trim()) return 'How-to URL is required.';
    if (!form.supported_harness.trim()) return 'Supported harness is required.';
    if (!maintainers.every((item) => item.name.trim() && item.contact.trim())) {
      return 'Every maintainer needs a name and contact.';
    }
    if (!tasks.every((item) => item.name.trim() && item.description.trim())) {
      return 'Every task needs a name and description.';
    }
    return null;
  };

  const validate = () => {
    if (uploadMode === 'form') {
      const formError = validateFormMode();
      if (formError) return formError;
    } else if (!jsonPayload.trim()) {
      return 'Skill JSON is required.';
    }

    if (attachments.length === 0 && existingFiles.length === 0) return 'Upload at least one file.';
    if (!hasAgentMd) return 'agent.md is mandatory.';
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('idle');
    setMessage('');

    const validationError = validate();
    if (validationError) {
      setStatus('error');
      setMessage(validationError);
      return;
    }

    try {
      setIsLoading(true);
      const payload = new FormData();

      if (uploadMode === 'form') {
        Object.entries(form).forEach(([key, value]) => payload.append(key, value));
        payload.append('maintainersJson', JSON.stringify(maintainers));
        payload.append('tasksJson', JSON.stringify(tasks));
      } else {
        payload.append('jsonPayload', jsonPayload);
      }

      attachments.forEach((file) => payload.append('attachments', file));

      const url = editingSubmission
        ? `/api/user/submissions/${editingSubmission.agent['agent id']}`
        : '/api/agents';
      const method = editingSubmission ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${tokenStorage.getAccessToken() || ''}`,
        },
        body: payload,
      });

      if (response.status === 401) {
        throw new Error(
          editingSubmission
            ? 'Please sign in before editing a skill.'
            : 'Please sign in before uploading a skill.'
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setStatus('success');
      setMessage(
        result.message ||
          (editingSubmission
            ? `Skill "${form.name}" updated and resubmitted successfully.`
            : 'Skill submitted successfully.')
      );

      if (editingSubmission) {
        onCancelEdit?.();
      } else {
        const initialMaintainers = [{ name: '', contact: '' }];
        const initialTasks = [{ name: '', description: '', async: false }];
        setForm(emptyForm);
        setMaintainers(initialMaintainers);
        setTasks(initialTasks);
        setJsonPayload(buildJsonTemplate(emptyForm, initialMaintainers, initialTasks));
        setJsonFileName('');
        setJsonFileInputKey((value) => value + 1);
      }

      setAttachments([]);
      setExistingFiles([]);
      setFileInputKey((value) => value + 1);
      onSubmitted?.();
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {editingSubmission && (
        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                <PencilLine className="h-3.5 w-3.5" />
                Editing existing submission
              </div>
              <h3 className="mt-3 text-lg font-semibold text-text-primary">
                {editingSubmission.agent.name}
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                Resubmitting keeps the same skill ID and sends the updated version back through
                admin review.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelEdit}
              className="sel-button-ghost border border-border px-3 py-2 text-sm"
            >
              <X className="h-4 w-4" />
              Cancel edit
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-bg-secondary p-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setUploadMode('form')}
            className={`sel-button px-4 py-3 text-sm ${
              uploadMode === 'form'
                ? 'bg-primary text-white shadow-[0_0_24px_-18px_rgba(0,120,212,0.9)]'
                : 'bg-bg-primary text-text-primary'
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload with Form
          </button>
          <button
            type="button"
            onClick={() => {
              if (uploadMode === 'form') {
                setJsonPayload(buildJsonTemplate(form, maintainers, tasks));
              }
              setUploadMode('json');
            }}
            className={`sel-button px-4 py-3 text-sm ${
              uploadMode === 'json'
                ? 'bg-primary text-white shadow-[0_0_24px_-18px_rgba(0,120,212,0.9)]'
                : 'bg-bg-primary text-text-primary'
            }`}
          >
            <Braces className="h-4 w-4" />
            Upload with JSON
          </button>
        </div>
      </div>

      {uploadMode === 'form' ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="sel-label">Skill ID *</label>
              <input
                className="sel-input px-4 py-3"
                value={form.starterkit_id}
                onChange={(e) => updateForm('starterkit_id', e.target.value)}
                placeholder="secure-code-guard"
                disabled={Boolean(editingSubmission)}
              />
              <p className="mt-2 text-xs text-text-muted">
                Use lowercase letters, numbers, and hyphens only.
              </p>
            </div>
            <div>
              <label className="sel-label">Skill Name *</label>
              <input className="sel-input px-4 py-3" value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Cyber Armor Guard" />
            </div>
            <div className="md:col-span-2">
              <label className="sel-label">Description *</label>
              <textarea className="sel-input min-h-24 px-4 py-3" value={form.description} onChange={(e) => updateForm('description', e.target.value)} />
            </div>
            <div>
              <label className="sel-label">Origin Org *</label>
              <input className="sel-input px-4 py-3" value={form.origin_org} onChange={(e) => updateForm('origin_org', e.target.value)} />
            </div>
            <div>
              <label className="sel-label">Sub Org</label>
              <input className="sel-input px-4 py-3" value={form.origin_sub_org} onChange={(e) => updateForm('origin_sub_org', e.target.value)} />
            </div>
            <div>
              <label className="sel-label">Creator *</label>
              <input className="sel-input px-4 py-3" value={form.origin_creator} onChange={(e) => updateForm('origin_creator', e.target.value)} />
            </div>
            <div>
              <label className="sel-label">Version *</label>
              <input className="sel-input px-4 py-3" value={form.version} onChange={(e) => updateForm('version', e.target.value)} placeholder="2.1.0" />
            </div>
            <div>
              <label className="sel-label">Status *</label>
              <select className="sel-input px-4 py-3" value={form.status} onChange={(e) => updateForm('status', e.target.value)}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="sel-label">Technology *</label>
              <input className="sel-input px-4 py-3" value={form.technology} onChange={(e) => updateForm('technology', e.target.value)} placeholder="Next.js, Zod" />
            </div>
            <div>
              <label className="sel-label">Primary Specialization *</label>
              <input className="sel-input px-4 py-3" value={form.specialization_primary} onChange={(e) => updateForm('specialization_primary', e.target.value)} placeholder="security_review" />
            </div>
            <div>
              <label className="sel-label">Domain Specific</label>
              <input className="sel-input px-4 py-3" value={form.specialization_domain_specific} onChange={(e) => updateForm('specialization_domain_specific', e.target.value)} placeholder="Auth Patterns, Data Sanitization" />
            </div>
            <div>
              <label className="sel-label">Supported Harness *</label>
              <input className="sel-input px-4 py-3" value={form.supported_harness} onChange={(e) => updateForm('supported_harness', e.target.value)} placeholder="Windsurf, Codex" />
            </div>
            <div>
              <label className="sel-label">README URL *</label>
              <input className="sel-input px-4 py-3" value={form.documentation_readme} onChange={(e) => updateForm('documentation_readme', e.target.value)} />
            </div>
            <div>
              <label className="sel-label">How-to URL *</label>
              <input className="sel-input px-4 py-3" value={form.documentation_howto} onChange={(e) => updateForm('documentation_howto', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="sel-label">Changelog</label>
              <input className="sel-input px-4 py-3" value={form.documentation_changelog} onChange={(e) => updateForm('documentation_changelog', e.target.value)} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">Maintainers *</h3>
              <button type="button" onClick={() => setMaintainers((current) => [...current, { name: '', contact: '' }])} className="sel-button-ghost border border-border px-3 py-2 text-sm">
                <Plus className="h-4 w-4" />
                Add maintainer
              </button>
            </div>
            {maintainers.map((maintainer, index) => (
              <div key={index} className="grid gap-3 rounded-xl border border-border bg-bg-secondary p-4 md:grid-cols-[1fr_1fr_auto]">
                <input className="sel-input px-4 py-3" value={maintainer.name} onChange={(e) => setMaintainers((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item))} placeholder="Maintainer name" />
                <input className="sel-input px-4 py-3" value={maintainer.contact} onChange={(e) => setMaintainers((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, contact: e.target.value } : item))} placeholder="Maintainer contact" />
                <button type="button" onClick={() => setMaintainers((current) => current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index))} className="sel-button-ghost border border-border px-3 py-2 text-sm">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">Tasks *</h3>
              <button type="button" onClick={() => setTasks((current) => [...current, { name: '', description: '', async: false }])} className="sel-button-ghost border border-border px-3 py-2 text-sm">
                <Plus className="h-4 w-4" />
                Add task
              </button>
            </div>
            {tasks.map((task, index) => (
              <div key={index} className="space-y-3 rounded-xl border border-border bg-bg-secondary p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <input className="sel-input px-4 py-3" value={task.name} onChange={(e) => setTasks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item))} placeholder="Task name" />
                  <button type="button" onClick={() => setTasks((current) => current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index))} className="sel-button-ghost border border-border px-3 py-2 text-sm">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <textarea className="sel-input min-h-20 px-4 py-3" value={task.description} onChange={(e) => setTasks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, description: e.target.value } : item))} placeholder="Task description" />
                <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
                  <input type="checkbox" checked={task.async} onChange={(e) => setTasks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, async: e.target.checked } : item))} />
                  Async task
                </label>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-bg-secondary p-5">
            <label className="sel-label">Upload Skill JSON File *</label>
            <input
              key={jsonFileInputKey}
              type="file"
              accept=".json,application/json"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                try {
                  const text = await file.text();
                  JSON.parse(text);
                  setJsonPayload(text);
                  setJsonFileName(file.name);
                  setStatus('idle');
                  setMessage('');
                } catch {
                  setStatus('error');
                  setMessage('Uploaded JSON file is invalid.');
                  setJsonFileName('');
                } finally {
                  setJsonFileInputKey((value) => value + 1);
                }
              }}
              className="block w-full text-sm text-text-secondary"
            />
            <p className="mt-2 text-sm text-text-secondary">
              Upload the skill JSON as a file here. Agent attachments stay separate below.
            </p>
            {jsonFileName && (
              <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary">
                <span className="inline-flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  {jsonFileName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setJsonFileName('');
                    setJsonPayload(
                      buildJsonTemplate(emptyForm, [{ name: '', contact: '' }], [
                        { name: '', description: '', async: false },
                      ])
                    );
                    setJsonFileInputKey((value) => value + 1);
                  }}
                  className="sel-button-ghost border border-border px-2 py-1 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            )}
          </div>

          <label className="sel-label">Skill JSON Preview *</label>
          <textarea
            className="sel-input min-h-[28rem] px-4 py-3 font-mono text-sm"
            value={jsonPayload}
            onChange={(event) => setJsonPayload(event.target.value)}
            spellCheck={false}
          />
          <p className="text-sm text-text-secondary">
            JSON uploads must still include an <code>agent.md</code> file in attachments. The JSON file and the agent files are handled separately.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-bg-secondary/75 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_44px_-24px_rgba(0,120,212,0.35)]">
        <div className="flex items-center gap-3">
          <Upload className="h-6 w-6 text-primary" />
          <div>
            <p className="font-medium text-text-primary">Attachments *</p>
            <p className="text-sm text-text-secondary">
              Upload <code>agent.md</code>, one demo <code>.mp4</code> if available, plus any additional PDFs, images, or support artifacts.
            </p>
          </div>
        </div>

        {existingFiles.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-text-primary">
              <RefreshCcw className="h-4 w-4 text-primary" />
              Existing uploaded files kept on resubmission
            </div>
            <div className="space-y-2">
              {existingFiles.map((file) => (
                <div key={file.relativePath} className="flex items-center justify-between rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary">
                  <span className="inline-flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {file.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted">{formatFileSize(file.size)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setExistingFiles((current) =>
                          current.filter((item) => item.relativePath !== file.relativePath)
                        )
                      }
                      className="sel-button-ghost border border-border px-2 py-1 text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <input
          key={fileInputKey}
          type="file"
          multiple
          accept=".md,.mp4,.pdf,.png,.jpg,.jpeg,.gif,.webm,.mov"
          onChange={(event) => {
            const incoming = Array.from(event.target.files || []);
            if (!incoming.length) return;
            setAttachments((current) => mergeFiles(current, incoming));
            setFileInputKey((value) => value + 1);
          }}
          disabled={isLoading}
          className="mt-4 block w-full text-sm text-text-secondary"
        />

        {attachments.length > 0 && (
          <div className="mt-4 space-y-2">
            {attachments.map((file) => (
              <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary">
                <span>
                  {file.name} <span className="text-text-muted">({formatFileSize(file.size)})</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setAttachments((current) =>
                      current.filter((item) => item.name.toLowerCase() !== file.name.toLowerCase())
                    )
                  }
                  className="sel-button-ghost border border-border px-2 py-1 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {!hasAgentMd && (attachments.length > 0 || existingFiles.length > 0) && (
          <p className="mt-3 text-sm text-error">agent.md is still missing from the file set.</p>
        )}
      </div>

      <button type="submit" disabled={isLoading} className="sel-button-primary w-full px-6 py-3">
        {isLoading
          ? editingSubmission
            ? 'Resubmitting skill...'
            : 'Submitting skill...'
          : editingSubmission
            ? 'Save Changes and Resubmit'
            : 'Submit Skill for Approval'}
      </button>

      {message && (
        <div
          className={`mt-4 flex items-start gap-2 rounded-xl p-4 ${
            status === 'success'
              ? 'border border-success/20 bg-success/10'
              : 'border border-error/20 bg-error/10'
          }`}
        >
          {status === 'success' ? (
            <>
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
              <p className="text-sm text-text-primary">{message}</p>
            </>
          ) : (
            <>
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-error" />
              <p className="text-sm text-text-primary">{message}</p>
            </>
          )}
        </div>
      )}
    </form>
  );
}
