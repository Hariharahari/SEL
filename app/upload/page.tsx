'use client';

import { useState } from 'react';
import UploadForm from '@/components/UploadForm';
import { CheckCircle, Shield, Upload, Zap } from 'lucide-react';

export default function UploadPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);

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
        <div className="sel-shell max-w-6xl space-y-8">
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
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-text-primary">Upload Your Skill</h2>
              <p className="mt-2 max-w-3xl text-text-secondary">
                Follow the current schema so your submission fits the review, embedding, analytics, and directory pipeline.
              </p>
            </div>

            <UploadForm
              onSubmitted={() => {
                setIsSubmitted(true);
              }}
            />

            {isSubmitted && (
              <div className="mt-6 rounded-2xl border border-success/20 bg-success/10 p-4 text-sm text-text-primary">
                Submission sent successfully. You can track edits, approval state, and rejection notes from the submissions page.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
