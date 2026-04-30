'use client';

import { useEffect, useState } from 'react';
import UploadForm from '@/components/UploadForm';
import { Upload, CheckCircle, Shield, Zap, BookOpen, Code2 } from 'lucide-react';
import { tokenStorage } from '@/lib/auth';

interface SubmissionRecord {
  agent: {
    'agent id': string;
    name: string;
    description: string;
    version: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  rejectionReason?: string;
}

export default function UploadPage() {
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);

  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    if (!token) return;

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

  return (
    <div className="sel-page">
      <section className="border-b border-border bg-bg-secondary px-4 py-10">
        <div className="sel-shell max-w-4xl">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-card">
              <Upload className="h-7 w-7" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-3xl font-bold text-transparent">
                Upload Skill
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-text-secondary">
                Submit a SEL-compatible skill card into the review, indexing, and directory workflow.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-bg-primary px-4 py-10">
        <div className="sel-shell">
          <h2 className="mb-8 text-2xl font-bold text-text-primary">Why Share Your Skill?</h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="sel-card p-8">
              <div className="mb-4 flex items-center gap-4">
                <div className="rounded-lg bg-warning/10 p-3">
                  <Zap className="h-6 w-6 text-warning" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary">Instant Impact</h3>
              </div>
              <p className="text-text-secondary">
                Reach teams in the directory with a reusable skill package once it clears review.
              </p>
            </div>

            <div className="sel-card p-8">
              <div className="mb-4 flex items-center gap-4">
                <div className="rounded-lg bg-info/10 p-3">
                  <CheckCircle className="h-6 w-6 text-info" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary">Workflow Ready</h3>
              </div>
              <p className="text-text-secondary">
                Your upload flows through approval, NVIDIA analysis, vector indexing, and analytics before it goes live.
              </p>
            </div>

            <div className="sel-card p-8">
              <div className="mb-4 flex items-center gap-4">
                <div className="rounded-lg bg-success/10 p-3">
                  <Shield className="h-6 w-6 text-success" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary">Review Confidence</h3>
              </div>
              <p className="text-text-secondary">
                Keep metadata, schema, and ownership details consistent so admins can review and publish confidently.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-bg-primary px-4 py-10">
        <div className="sel-shell max-w-4xl">
          <div className="sel-card p-10">
            <h2 className="mb-2 text-3xl font-bold text-text-primary">Upload Your Skill</h2>
            <p className="mb-8 text-text-secondary">
              Follow the current skill card schema so your submission fits the review, embedding, analytics, and directory pipeline.
            </p>

            <UploadForm />
          </div>
        </div>
      </section>

      {submissions.length > 0 && (
        <section className="bg-bg-primary px-4 py-4">
          <div className="sel-shell max-w-4xl">
            <div className="sel-card p-8">
              <h2 className="text-2xl font-bold text-text-primary">Your Skill Submissions</h2>
              <div className="mt-6 space-y-4">
                {submissions.map((record) => (
                  <div key={`${record.agent['agent id']}-${record.submittedAt}`} className="rounded-xl border border-border bg-bg-secondary p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-text-primary">{record.agent.name}</h3>
                        <p className="mt-1 text-sm text-text-secondary">{record.agent.description}</p>
                      </div>
                      <span
                        className={`sel-badge ${
                          record.status === 'approved'
                            ? 'bg-success/10 text-success'
                            : record.status === 'rejected'
                              ? 'bg-error/10 text-error'
                              : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {record.status}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-text-muted">
                      Submitted {new Date(record.submittedAt).toLocaleString()} - version {record.agent.version}
                    </p>
                    {record.status === 'rejected' && record.rejectionReason && (
                      <div className="mt-3 rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error">
                        Rejection reason: {record.rejectionReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="bg-bg-secondary px-4 py-10">
        <div className="sel-shell max-w-4xl">
          <h2 className="mb-12 text-3xl font-bold text-text-primary">Skill Requirements</h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="sel-card p-8">
              <div className="mb-6 flex items-center gap-3">
                <Code2 className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold text-text-primary">Required Fields</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'skill_card.starterkit_id - Unique skill identifier',
                  'skill_card.name - Human-readable skill name',
                  'skill_card.description - What the skill does',
                  'skill_card.origin - Organization and creator info',
                  'skill_card.maintainers - Contact information',
                  'skill_card.version - Semantic version',
                  'skill_card.status - Alpha, Beta, RC, Stable, Deprecated, Verified',
                  'skill_card.technology - Array of technologies',
                  'skill_card.specialization - Primary domain and domain_specific tags',
                  'skill_card.tasks - Array of supported tasks',
                  'skill_card.documentation - README, how-to, changelog',
                  'skill_card.supported_harness - Supported runtimes or harnesses',
                ].map((field) => (
                  <li key={field} className="flex gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                    <span className="text-text-secondary">{field}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sel-card p-8">
              <div className="mb-6 flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-secondary" />
                <h3 className="text-xl font-semibold text-text-primary">Best Practices</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Keep the JSON wrapped under skill_card',
                  'Use a stable starterkit_id you can version over time',
                  'Describe the real review or automation task clearly',
                  'List technologies accurately',
                  'Provide real maintainer contacts',
                  'Use domain_specific tags for better semantic search',
                  'Include supported_harness values explicitly',
                  'Update versions consistently',
                  'Mark verified skills when appropriate',
                  'Expect the schema to evolve over time',
                ].map((practice) => (
                  <li key={practice} className="flex gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-secondary" />
                    <span className="text-text-secondary">{practice}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-bg-primary px-4 py-10">
        <div className="sel-shell max-w-4xl">
          <h2 className="mb-8 text-3xl font-bold text-text-primary">Skill Schema Reference</h2>

          <div className="overflow-x-auto rounded-xl border border-border bg-[#111827] p-6 shadow-card">
            <pre className="whitespace-pre-wrap break-words text-sm font-mono text-slate-200">
{`{
  "skill_card": {
    "starterkit_id": "secure-code-guard",
    "name": "Cyber Armor Guard",
    "description": "Audits Next.js API routes for IDOR, CSRF, and SQL Injection.",
    "origin": {
      "org": "SEL-Core",
      "sub_org": "Security",
      "creator": "Sec-Lead"
    },
    "maintainers": [
      {
        "name": "Security Ops",
        "contact": "sec@company.com"
      }
    ],
    "version": "2.1.0",
    "status": "verified",
    "technology": ["Next.js", "Zod"],
    "specialization": {
      "primary": "security_review",
      "domain_specific": ["Auth Patterns", "Data Sanitization"]
    },
    "tasks": [
      {
        "name": "Audit API Route",
        "description": "Scans for missing validation.",
        "async": false
      }
    ],
    "documentation": {
      "readme": "https://github.com/sel/sec/blob/main/docs.md",
      "howto": "https://github.com/sel/sec/blob/main/docs.md#setup",
      "changelog": "v2 release"
    },
    "supported_harness": ["Windsurf"]
  }
}`}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
