'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpCircle, CheckCircle, Clock3, PencilLine, RefreshCcw, XCircle } from 'lucide-react';
import { tokenStorage } from '@/lib/auth';
import UploadForm, { type EditableSubmissionRecord } from '@/components/UploadForm';

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<EditableSubmissionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSubmission, setEditingSubmission] = useState<EditableSubmissionRecord | null>(null);

  const loadSubmissions = useCallback(() => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setSubmissions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    fetch('/api/user/submissions', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
      .then((response) => (response.ok ? response.json() : { data: [] }))
      .then((payload) => setSubmissions(payload.data || []))
      .catch((error) => console.error('Failed to load user submissions:', error))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const statusMeta = {
    approved: {
      icon: CheckCircle,
      label: 'Approved',
      className: 'bg-success/10 text-success border-success/20',
    },
    pending: {
      icon: Clock3,
      label: 'Pending review',
      className: 'bg-warning/10 text-warning border-warning/20',
    },
    rejected: {
      icon: XCircle,
      label: 'Needs changes',
      className: 'bg-error/10 text-error border-error/20',
    },
  } as const;

  return (
    <div className="sel-page">
      <section className="border-b border-border bg-bg-secondary px-4 py-10">
        <div className="sel-shell max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-[0_0_30px_rgba(0,120,212,0.28)]">
                <ArrowUpCircle className="h-7 w-7" />
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-3xl font-bold text-transparent">
                  Your Skill Submissions
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-text-secondary">
                  Review approval state, read rejection notes, and reopen a submission for edits without losing the attached files.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={loadSubmissions}
                className="sel-button-ghost border border-border px-4 py-2 text-sm"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
              <Link href="/upload" className="sel-button-primary px-4 py-2 text-sm">
                <PencilLine className="h-4 w-4" />
                New Submission
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-bg-primary px-4 py-10">
        <div className="sel-shell max-w-6xl">
          {editingSubmission && (
            <div className="sel-card mb-8 p-8 shadow-[0_0_40px_-30px_rgba(0,120,212,0.7)]">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-text-primary">Edit and Resubmit Skill</h2>
                  <p className="mt-2 max-w-3xl text-text-secondary">
                    Update the existing submission here and send it back through the same approval workflow without leaving this page.
                  </p>
                </div>
                <div className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  {editingSubmission.agent['agent id']}
                </div>
              </div>

              <UploadForm
                editingSubmission={editingSubmission}
                onCancelEdit={() => setEditingSubmission(null)}
                onSubmitted={() => {
                  setEditingSubmission(null);
                  loadSubmissions();
                }}
              />
            </div>
          )}

          {isLoading ? (
            <div className="sel-card p-6 text-sm text-text-secondary">Loading your submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="sel-card p-6 text-sm text-text-secondary">
              No submissions yet. Once you upload a skill, it will appear here for review tracking and edits.
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              {submissions.map((record) => {
                const meta = statusMeta[record.status];
                const Icon = meta.icon;

                return (
                  <div
                    key={`${record.agent['agent id']}-${record.submittedAt}`}
                    className="sel-card p-6 shadow-[0_0_34px_-26px_rgba(0,120,212,0.55)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {meta.label}
                        </div>
                        <h2 className="mt-3 text-xl font-semibold text-text-primary">{record.agent.name}</h2>
                        <p className="mt-2 text-sm text-text-secondary">{record.agent.description}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingSubmission(record)}
                        className="sel-button-ghost border border-border px-3 py-2 text-sm"
                      >
                        <PencilLine className="h-4 w-4" />
                        Edit
                      </button>
                    </div>

                    <div className="mt-5 grid gap-3 text-sm text-text-secondary md:grid-cols-2">
                      <div className="rounded-xl border border-border bg-bg-primary p-3">
                        <span className="block text-xs uppercase tracking-[0.16em] text-text-muted">Skill ID</span>
                        <span className="mt-1 block font-medium text-text-primary">{record.agent['agent id']}</span>
                      </div>
                      <div className="rounded-xl border border-border bg-bg-primary p-3">
                        <span className="block text-xs uppercase tracking-[0.16em] text-text-muted">Last submitted</span>
                        <span className="mt-1 block font-medium text-text-primary">
                          {new Date(record.submittedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {record.rejectionReason && (
                      <div className="mt-4 rounded-xl border border-error/20 bg-error/10 p-3 text-sm text-error">
                        Rejection reason: {record.rejectionReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
