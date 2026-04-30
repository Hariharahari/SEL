'use client';

import { AlertCircle, CheckCircle, FileText, PencilLine, Plus, RefreshCcw, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { tokenStorage } from '@/lib/auth';
import type { SELAgentCard, SubmissionAttachment } from '@/types';

type MaintainerInput = {
  name: string;
  contact: string;
};

type TaskInput = {
  name: string;
  description: string;
  async: boolean;
};

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
  status: 'verified',
  technology: '',
  specialization_primary: '',
  specialization_domain_specific: '',
  documentation_readme: '',
  documentation_howto: '',
  documentation_changelog: '',
  supported_harness: '',
  video_url: '',
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toCommaList(values?: string[]) {
  return (values || []).join(', ');
}

export default function UploadForm({
  editingSubmission = null,
  onSubmitted,
  onCancelEdit,
}: UploadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<SubmissionAttachment[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [maintainers, setMaintainers] = useState<MaintainerInput[]>([{ name: '', contact: '' }]);
  const [tasks, setTasks] = useState<TaskInput[]>([{ name: '', description: '', async: false }]);

  useEffect(() => {
    if (!editingSubmission) {
      setForm(emptyForm);
      setMaintainers([{ name: '', contact: '' }]);
      setTasks([{ name: '', description: '', async: false }]);
      setExistingFiles([]);
      setAttachments([]);
      setStatus('idle');
      setMessage('');
      return;
    }

    const { agent } = editingSubmission;
    setForm({
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
      video_url: agent.video_url || '',
    });
    setMaintainers(
      agent.maintainers.length
        ? agent.maintainers.map((item) => ({ name: item.name, contact: item.contact }))
        : [{ name: '', contact: '' }]
    );
    setTasks(
      agent.tasks.length
        ? agent.tasks.map((item) => ({
            name: item.name,
            description: item.description,
            async: item.async,
          }))
        : [{ name: '', description: '', async: false }]
    );
    setExistingFiles(agent.sourceFiles || []);
    setAttachments([]);
    setStatus('idle');
    setMessage('');
  }, [editingSubmission]);

  const hasAgentMd = useMemo(() => {
    const currentAttachments = attachments.some((file) => file.name.toLowerCase() === 'agent.md');
    const currentExisting = existingFiles.some((file) => file.name.toLowerCase() === 'agent.md');
    return currentAttachments || currentExisting;
  }, [attachments, existingFiles]);

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validate = () => {
    if (!form.starterkit_id.trim()) return 'Skill ID is required.';
    if (!form.name.trim()) return 'Skill name is required.';
    if (!form.description.trim()) return 'Description is required.';
    if (!form.origin_org.trim()) return 'Origin organization is required.';
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

      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      payload.append('maintainersJson', JSON.stringify(maintainers));
      payload.append('tasksJson', JSON.stringify(tasks));
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
            : `Skill "${form.name}" submitted successfully.`)
      );

      if (editingSubmission) {
        onCancelEdit?.();
      } else {
        setForm(emptyForm);
        setMaintainers([{ name: '', contact: '' }]);
        setTasks([{ name: '', description: '', async: false }]);
      }

      setAttachments([]);
      setExistingFiles([]);
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
          <label className="sel-label">Creator</label>
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
          <label className="sel-label">Demo Video URL</label>
          <input className="sel-input px-4 py-3" value={form.video_url} onChange={(e) => updateForm('video_url', e.target.value)} />
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

      <div className="rounded-2xl border border-border bg-bg-secondary/75 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_44px_-24px_rgba(0,120,212,0.35)]">
        <div className="flex items-center gap-3">
          <Upload className="h-6 w-6 text-primary" />
          <div>
            <p className="font-medium text-text-primary">Attachments *</p>
            <p className="text-sm text-text-secondary">
              Upload multiple files. `agent.md` is mandatory. Demo videos and supporting files can be attached here too.
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
                  <span className="text-text-muted">{formatFileSize(file.size)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <input
          type="file"
          multiple
          onChange={(event) => setAttachments(Array.from(event.target.files || []))}
          disabled={isLoading}
          className="mt-4 block w-full text-sm text-text-secondary"
        />

        {attachments.length > 0 && (
          <div className="mt-4 space-y-2">
            {attachments.map((file) => (
              <div key={`${file.name}-${file.size}`} className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary">
                {file.name} <span className="text-text-muted">({formatFileSize(file.size)})</span>
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
