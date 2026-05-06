'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileCode2,
  History,
  Shield,
  XCircle,
} from 'lucide-react';
import { tokenStorage } from '@/lib/auth';
import type { SELAgentCard, SubmissionActivityLogEntry } from '@/types';

interface SubmissionRecord {
  agent: SELAgentCard;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  submittedBy?: string;
  revision?: number;
  activityLog?: SubmissionActivityLogEntry[];
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

    fetch(`/api/admin/agents/${submissionId}`, {
      headers,
      credentials: 'include',
    })
      .then(async (response) => {
        if (response.status === 401) {
          router.push('/login');
          return null;
        }

        if (response.status === 403) {
          throw new Error('Admin access is required for this page.');
        }

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to load skill submission');
        }

        return response.json();
      })
      .then((payload) => {
        if (!active || !payload) return;
        setRecord(payload.data);
        setIsLoading(false);
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load skill submission');
        setIsLoading(false);
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
    return (
      <div className="sel-page p-6">
        <div className="sel-shell max-w-6xl">
          <div className="rounded-[24px] border border-border bg-bg-secondary p-6 text-sm text-text-secondary shadow-[0_0_28px_-24px_rgba(0,120,212,0.45)]">
            Loading skill review...
          </div>
        </div>
      </div>
    );
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
            <div className="flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-text-primary">Skill Card Details</h2>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-border bg-bg-secondary p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Skill ID</p>
                <p className="mt-2 break-words font-medium text-text-primary">{skill['agent id']}</p>
              </div>
              <div className="rounded-2xl border border-border bg-bg-secondary p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Version</p>
                <p className="mt-2 font-medium text-text-primary">{skill.version}</p>
              </div>
              <div className="rounded-2xl border border-border bg-bg-secondary p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Status</p>
                <p className="mt-2 font-medium capitalize text-text-primary">{skill.status}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-border bg-bg-secondary p-5">
                <h3 className="text-sm font-semibold text-text-primary">Origin</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-text-muted">Organization</dt>
                    <dd className="text-right text-text-primary">{skill.origin.org}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-text-muted">Sub org</dt>
                    <dd className="text-right text-text-primary">{skill.origin.sub_org || 'Not provided'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-text-muted">Creator</dt>
                    <dd className="text-right text-text-primary">{skill.origin.creator || 'Not provided'}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-border bg-bg-secondary p-5">
                <h3 className="text-sm font-semibold text-text-primary">Specialization</h3>
                <p className="mt-3 text-sm text-text-primary">{skill.specialization.primary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(skill.specialization['domain specific'] || []).length === 0 ? (
                    <span className="text-sm text-text-muted">No domain-specific tags</span>
                  ) : (
                    (skill.specialization['domain specific'] || []).map((item) => (
                      <span key={item} className="sel-badge bg-bg-primary text-text-secondary">
                        {item}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-bg-secondary p-5">
              <h3 className="text-sm font-semibold text-text-primary">Technology</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {skill.technology.map((item) => (
                  <span key={item} className="sel-badge bg-bg-primary text-text-secondary">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-border bg-bg-secondary p-5">
                <h3 className="text-sm font-semibold text-text-primary">Maintainers</h3>
                <div className="mt-3 space-y-3">
                  {skill.maintainers.map((maintainer, index) => (
                    <div key={`${maintainer.name}-${index}`} className="rounded-xl border border-border bg-bg-primary p-3">
                      <p className="font-medium text-text-primary">{maintainer.name}</p>
                      <p className="mt-1 text-sm text-text-secondary">{maintainer.contact}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-bg-secondary p-5">
                <h3 className="text-sm font-semibold text-text-primary">Documentation</h3>
                <div className="mt-3 space-y-3 text-sm">
                  <div className="rounded-xl border border-border bg-bg-primary p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Readme</p>
                    <p className="mt-2 break-words text-text-primary">{skill.documentation.readme}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-bg-primary p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-muted">How-to</p>
                    <p className="mt-2 break-words text-text-primary">{skill.documentation.howto}</p>
                  </div>
                  {skill.documentation.changelog && (
                    <div className="rounded-xl border border-border bg-bg-primary p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Changelog</p>
                      <p className="mt-2 break-words text-text-primary">{skill.documentation.changelog}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-bg-secondary p-5">
              <h3 className="text-sm font-semibold text-text-primary">Tasks</h3>
              <div className="mt-3 grid gap-3">
                {skill.tasks.map((task, index) => (
                  <div key={`${task.name}-${index}`} className="rounded-xl border border-border bg-bg-primary p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-text-primary">{task.name}</p>
                      <span className="sel-badge bg-bg-tertiary text-text-secondary">
                        {task.async ? 'async' : 'sync'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-text-secondary">{task.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <details className="mt-4 rounded-2xl border border-border bg-bg-secondary p-5">
              <summary className="cursor-pointer text-sm font-semibold text-text-primary">
                Raw Skill JSON
              </summary>
              <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-bg-primary p-5">
                <pre className="whitespace-pre-wrap break-words text-sm text-text-secondary">
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
            </details>
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

            {skill.agentMdReview && (
              <div className="mt-6 rounded-2xl border border-border bg-bg-secondary p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">Agent Markdown Review</h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      This report is generated from <code>{skill.agentMdReview.fileName}</code> only.
                    </p>
                  </div>
                  <span
                    className={`sel-badge ${
                      skill.agentMdReview.riskLevel === 'critical' || skill.agentMdReview.riskLevel === 'high'
                        ? 'bg-error/10 text-error'
                        : skill.agentMdReview.riskLevel === 'medium'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-success/10 text-success'
                    }`}
                  >
                    {skill.agentMdReview.riskLevel} risk
                  </span>
                </div>

                <p className="mt-4 text-sm text-text-primary">{skill.agentMdReview.summary}</p>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-xl border border-border bg-bg-primary p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Overall rating</p>
                    <p className="mt-2 text-2xl font-semibold text-text-primary">
                      {skill.agentMdReview.overallRating}/5
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-bg-primary p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Overall score</p>
                    <p className="mt-2 text-2xl font-semibold text-text-primary">
                      {skill.agentMdReview.overallScore}/100
                    </p>
                  </div>
                  {[
                    { label: 'Malicious intent', value: skill.agentMdReview.scores.maliciousIntent },
                    { label: 'Verbosity', value: skill.agentMdReview.scores.verbosity },
                    { label: 'Optimization', value: skill.agentMdReview.scores.optimization },
                    { label: 'Clarity', value: skill.agentMdReview.scores.clarity },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-border bg-bg-primary p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-text-muted">{item.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-text-primary">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-xl border border-border bg-bg-primary p-4">
                    <h4 className="text-sm font-semibold text-text-primary">Detected strengths</h4>
                    <div className="mt-3 space-y-2">
                      {skill.agentMdReview.strengths.length === 0 ? (
                        <p className="text-sm text-text-secondary">No standout strengths were detected.</p>
                      ) : (
                        skill.agentMdReview.strengths.map((strength, index) => (
                          <div key={index} className="rounded-lg border border-border bg-bg-secondary p-3 text-sm text-text-primary">
                            {strength}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-bg-primary p-4">
                    <h4 className="text-sm font-semibold text-text-primary">Prompt metrics</h4>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {[
                        { label: 'Words', value: skill.agentMdReview.metrics.wordCount },
                        { label: 'Headings', value: skill.agentMdReview.metrics.headingCount },
                        { label: 'Bullets', value: skill.agentMdReview.metrics.bulletCount },
                        { label: 'Code blocks', value: skill.agentMdReview.metrics.codeBlockCount },
                        { label: 'Examples', value: skill.agentMdReview.metrics.exampleCount },
                        { label: 'Directive terms', value: skill.agentMdReview.metrics.directiveCount },
                        {
                          label: 'Avg sentence length',
                          value: `${skill.agentMdReview.metrics.averageSentenceLength} words`,
                        },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg border border-border bg-bg-secondary p-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-text-muted">{item.label}</p>
                          <p className="mt-2 text-sm font-medium text-text-primary">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">Findings</h4>
                    <div className="mt-3 space-y-3">
                      {skill.agentMdReview.issues.length === 0 ? (
                        <div className="rounded-xl border border-success/20 bg-success/10 p-4 text-sm text-text-primary">
                          No significant issues were detected in the current agent markdown.
                        </div>
                      ) : (
                        skill.agentMdReview.issues.map((issue, index) => (
                          <div key={`${issue.code}-${index}`} className="rounded-xl border border-border bg-bg-primary p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="sel-badge bg-bg-tertiary text-text-primary">{issue.category.replace(/_/g, ' ')}</span>
                              <span className="sel-badge bg-bg-tertiary text-text-secondary">{issue.severity}</span>
                            </div>
                            <p className="mt-3 text-sm text-text-primary">{issue.message}</p>
                            {issue.evidence && (
                              <div className="mt-3 rounded-lg border border-border bg-bg-secondary p-3 text-xs text-text-secondary">
                                <div className="mb-1 inline-flex items-center gap-2 font-medium text-text-primary">
                                  <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                                  Evidence
                                </div>
                                <p className="break-words">{issue.evidence}</p>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">Recommendations</h4>
                    <div className="mt-3 space-y-3">
                      {skill.agentMdReview.recommendations.map((recommendation, index) => (
                        <div key={index} className="rounded-xl border border-border bg-bg-primary p-4 text-sm text-text-secondary">
                          {recommendation}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
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
                  <dt className="text-text-muted">Revision</dt>
                  <dd className="text-text-primary">{record.revision || 1}</dd>
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

            <div className="sel-panel p-6">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">Submission Activity</h2>
              </div>
              <p className="mt-2 text-sm text-text-secondary">
                Cached submission and resubmission history for this skill.
              </p>

              <div className="mt-4 space-y-3">
                {(record.activityLog && record.activityLog.length > 0 ? [...record.activityLog] : [])
                  .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
                  .map((entry, index) => (
                    <div key={`${entry.timestamp}-${index}`} className="rounded-xl border border-border bg-bg-secondary p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="sel-badge bg-primary/10 text-primary">{entry.type}</span>
                          <span className="text-sm font-medium text-text-primary">
                            Revision {entry.revision || record.revision || 1}
                          </span>
                        </div>
                        <span className="text-xs text-text-muted">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {entry.actorId && (
                        <p className="mt-2 text-sm text-text-secondary">Actor: {entry.actorId}</p>
                      )}
                      {entry.note && (
                        <p className="mt-2 text-sm text-text-primary">{entry.note}</p>
                      )}
                      {entry.sourceFileNames && entry.sourceFileNames.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {entry.sourceFileNames.map((fileName) => (
                            <span key={fileName} className="sel-badge bg-bg-primary text-text-secondary">
                              {fileName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
