'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, Shield, XCircle } from 'lucide-react';
import { authApi, tokenStorage } from '@/lib/auth';
import type { SELAgentCard } from '@/types';

interface SubmissionRecord {
  agent: SELAgentCard;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  submittedBy?: string;
  rejectionReason?: string;
  reviewComment?: string;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminReviewDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const submissionId = typeof params?.id === 'string' ? params.id : '';
  const [record, setRecord] = useState<SubmissionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${tokenStorage.getAccessToken() || ''}`,
      'Content-Type': 'application/json',
    }),
    []
  );

  useEffect(() => {
    if (!submissionId) return;

    let active = true;

    authApi.getCurrentUser().then(async (result) => {
      if (!active) return;
      if (!result.success) {
        router.push('/login');
        return;
      }
      if (String(result.data.role).toUpperCase() !== 'ADMIN') {
        setError('Admin access is required for this page.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/admin/agents/${submissionId}`, {
          headers,
          credentials: 'include',
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to load skill submission');
        }
        const payload = await response.json();
        if (!active) return;
        setRecord(payload.data);
        setIsLoading(false);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load skill submission');
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [headers, router, submissionId]);

  const handleApprove = async () => {
    if (!record) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/agents/${record.agent['agent id']}/approve`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ reviewComment: reviewComment.trim() || undefined }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to approve skill');
      }

      router.push(`/admin/analytics/${record.agent['agent id']}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to approve skill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!record) return;
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/agents/${record.agent['agent id']}/reject`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to reject skill');
      }

      router.push('/admin/analytics');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to reject skill');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="sel-page p-6 text-sm text-text-secondary">Loading skill review...</div>;
  }

  if (!record) {
    return <div className="sel-page p-6 text-sm text-error">{error || 'Skill submission not found.'}</div>;
  }

  const skill = record.agent;

  return (
    <div className="sel-page p-6">
      <div className="sel-shell max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/admin/analytics" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
              <ArrowLeft className="h-4 w-4" />
              Back to Admin Analytics
            </Link>
            <h1 className="mt-4 text-3xl font-semibold text-text-primary">{skill.name}</h1>
            <p className="mt-2 max-w-3xl text-sm text-text-secondary">{skill.description}</p>
          </div>
          <div className="rounded-full border border-border bg-bg-secondary px-4 py-2 text-sm text-text-secondary">
            {record.status === 'pending' ? (
              <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-warning" /> Pending review</span>
            ) : record.status === 'approved' ? (
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Approved</span>
            ) : (
              <span className="inline-flex items-center gap-2"><XCircle className="h-4 w-4 text-error" /> Rejected</span>
            )}
          </div>
        </div>

        {error && <div className="rounded-xl border border-error/20 bg-error/10 p-4 text-sm text-error">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="sel-panel p-6">
            <h2 className="text-lg font-semibold text-text-primary">Skill Card Details</h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-[#111827] p-5">
              <pre className="whitespace-pre-wrap break-words text-sm text-slate-200">
                {JSON.stringify(
                  {
                    skill_card: {
                      starterkit_id: skill['agent id'],
                      name: skill.name,
                      description: skill.description,
                      origin: skill.origin,
                      maintainers: skill.maintainers,
                      version: skill.version,
                      status: skill.status,
                      technology: skill.technology,
                      specialization: {
                        primary: skill.specialization.primary,
                        domain_specific: skill.specialization['domain specific'] || [],
                      },
                      tasks: skill.tasks,
                      documentation: skill.documentation,
                      supported_harness: skill['supported harness'],
                      github_url: skill.github_url,
                      video_url: skill.video_url,
                    },
                  },
                  null,
                  2
                )}
              </pre>
            </div>
            {skill.sourceFiles && skill.sourceFiles.length > 0 && (
              <div className="mt-5">
                <h3 className="text-base font-semibold text-text-primary">Uploaded Files</h3>
                <div className="mt-3 space-y-2">
                  {skill.sourceFiles.map((file) => (
                    <div key={file.relativePath} className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary">
                      <a
                        href={`/api/admin/agents/${skill['agent id']}/files?path=${encodeURIComponent(file.relativePath)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        {file.name}
                      </a>{' '}
                      <span className="text-text-muted">({formatFileSize(file.size)})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="sel-panel p-6">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">Review Actions</h2>
              </div>
              <p className="mt-2 text-sm text-text-secondary">
                Approving will generate embeddings, classify category and subcategory, write the vector to FAISS, and then publish the skill to Redis.
              </p>

              <div className="mt-4 space-y-3">
                <label className="sel-label">Approval comment</label>
                <textarea
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  className="sel-input min-h-24 px-4 py-3"
                  placeholder="Optional note for this approval"
                />
              </div>

              <div className="mt-4 space-y-3">
                <label className="sel-label">Rejection reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  className="sel-input min-h-24 px-4 py-3"
                  placeholder="Explain why this skill is being rejected"
                />
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isSubmitting || record.status !== 'pending'}
                  className="sel-button-primary flex-1 px-4 py-3"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isSubmitting || record.status !== 'pending'}
                  className="sel-button-ghost flex-1 border border-error/40 px-4 py-3 text-error hover:bg-error/10"
                >
                  Reject
                </button>
              </div>
            </div>

            <div className="sel-panel p-6">
              <h2 className="text-lg font-semibold text-text-primary">Submission Metadata</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-text-muted">Submitted by</dt>
                  <dd className="text-text-primary">{record.submittedBy || 'Unknown'}</dd>
                </div>
                <div>
                  <dt className="text-text-muted">Submitted at</dt>
                  <dd className="text-text-primary">{new Date(record.submittedAt).toLocaleString()}</dd>
                </div>
                {record.rejectionReason && (
                  <div>
                    <dt className="text-text-muted">Rejection reason</dt>
                    <dd className="text-error">{record.rejectionReason}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
