'use client';

import { useCallback, useEffect, useState } from 'react';
import UploadForm, { type EditableSubmissionRecord } from '@/components/UploadForm';
import { ArrowUpCircle, CheckCircle, Clock3, PencilLine, Shield, Upload, XCircle, Zap } from 'lucide-react';
import { tokenStorage } from '@/lib/auth';

export default function UploadPage() {
  const [submissions, setSubmissions] = useState<EditableSubmissionRecord[]>([]);
  const [editingSubmission, setEditingSubmission] = useState<EditableSubmissionRecord | null>(null);

  const loadSubmissions = useCallback(() => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setSubmissions([]);
      return;
    }

    fetch('/api/user/submissions', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
      .then((response) => (response.ok ? response.json() : { data: [] }))
      .then((payload) => setSubmissions(payload.data || []))
      .catch((error) => console.error('Failed to load user submissions:', error));
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
        <div className="sel-shell max-w-5xl">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-[0_0_30px_rgba(0,120,212,0.28)]">
              <Upload className="h-7 w-7" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-3xl font-bold text-transparent">
                Upload Skill
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-text-secondary">
                Submit a skill, revise it after feedback, and resubmit the same record back into approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-bg-primary px-4 py-10">
        <div className="sel-shell grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  icon: Zap,
                  title: 'Iteration ready',
                  body: 'Rejected or already-approved skills can be edited and pushed back through review without starting from zero.',
                  accent: 'text-warning',
                  glow: 'shadow-[0_0_26px_-18px_rgba(244,183,64,0.75)]',
                },
                {
                  icon: CheckCircle,
                  title: 'Workflow connected',
                  body: 'Approval still drives categorization, NVIDIA analysis, FAISS indexing, and directory publishing.',
                  accent: 'text-info',
                  glow: 'shadow-[0_0_26px_-18px_rgba(78,161,255,0.75)]',
                },
                {
                  icon: Shield,
                  title: 'Review confidence',
                  body: 'Ownership, attachments, and agent.md stay attached to the same skill identity for admins to verify.',
                  accent: 'text-success',
                  glow: 'shadow-[0_0_26px_-18px_rgba(54,195,124,0.75)]',
                },
              ].map(({ icon: Icon, title, body, accent, glow }) => (
                <div key={title} className={`sel-card p-6 ${glow}`}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl border border-border bg-bg-primary p-3">
                      <Icon className={`h-5 w-5 ${accent}`} />
                    </div>
                    <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
                  </div>
                  <p className="text-sm text-text-secondary">{body}</p>
                </div>
              ))}
            </div>

            <div className="sel-card p-8 shadow-[0_0_40px_-30px_rgba(0,120,212,0.7)]">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-text-primary">
                    {editingSubmission ? 'Edit and Resubmit Skill' : 'Upload Your Skill'}
                  </h2>
                  <p className="mt-2 text-text-secondary">
                    Follow the current schema so your submission fits the review, embedding, analytics, and directory pipeline.
                  </p>
                </div>
                {editingSubmission && (
                  <div className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                    {editingSubmission.agent['agent id']}
                  </div>
                )}
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
          </div>

          <div className="space-y-6">
            <div className="sel-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-text-primary">Your Skill Submissions</h2>
              </div>
              <p className="text-sm text-text-secondary">
                Click edit on any submission to revise metadata, keep the uploaded files, and send it back to admin review.
              </p>
            </div>

            <div className="space-y-4">
              {submissions.length === 0 ? (
                <div className="sel-card p-6 text-sm text-text-secondary">
                  No submissions yet. Your uploaded skills will appear here for edit and resubmit.
                </div>
              ) : (
                submissions.map((record) => {
                  const meta = statusMeta[record.status];
                  const Icon = meta.icon;
                  const isEditing = editingSubmission?.agent['agent id'] === record.agent['agent id'];

                  return (
                    <div
                      key={`${record.agent['agent id']}-${record.submittedAt}`}
                      className={`sel-card p-5 transition-all ${
                        isEditing ? 'border-primary shadow-[0_0_30px_-22px_rgba(0,120,212,0.85)]' : ''
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>
                            <Icon className="h-3.5 w-3.5" />
                            {meta.label}
                          </div>
                          <h3 className="mt-3 text-lg font-semibold text-text-primary">{record.agent.name}</h3>
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

                      <div className="mt-4 grid gap-3 text-sm text-text-secondary md:grid-cols-2">
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
                })
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
