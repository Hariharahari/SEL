'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, Download, MessageSquare, Save, Shield, Sparkles } from 'lucide-react';
import { authApi, tokenStorage } from '@/lib/auth';
import { CATEGORIES, SUBCATEGORIES_BY_CATEGORY } from '@/lib/categoryMapping';
import { getAgentCategory } from '@/lib/agentCategory';
import type { SELAgentCard } from '@/types';

interface AgentAnalyticsDetail {
  agent: SELAgentCard;
  downloads: {
    overall: number;
    last7Days: number;
    last30Days: number;
    last365Days: number;
    lastDownloaded: string | null;
  };
  feedback: {
    totalFeedback: number;
    averageRating: number;
    distribution: Record<string, number>;
    feedbacks: Array<{
      feature: string;
      rating: number;
      comment: string;
      email: string;
      timestamp: string;
    }>;
  };
}

function FeedbackDonut({ distribution }: { distribution: Record<string, number> }) {
  const five = Number(distribution['5'] || 0);
  const four = Number(distribution['4'] || 0);
  const three = Number(distribution['3'] || 0);
  const two = Number(distribution['2'] || 0);
  const one = Number(distribution['1'] || 0);
  const total = Math.max(five + four + three + two + one, 1);
  const pct5 = (five / total) * 100;
  const pct4 = (four / total) * 100;
  const pct3 = (three / total) * 100;
  const pct2 = (two / total) * 100;

  return (
    <div className="relative h-40 w-40">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(#36c37c 0 ${pct5}%, #4ea1ff ${pct5}% ${
            pct5 + pct4
          }%, #f4b740 ${pct5 + pct4}% ${pct5 + pct4 + pct3}%, #fb923c ${
            pct5 + pct4 + pct3
          }% ${pct5 + pct4 + pct3 + pct2}%, #f87171 ${pct5 + pct4 + pct3 + pct2}% 100%)`,
        }}
      />
      <div className="absolute inset-[14px] rounded-full border border-border bg-bg-primary" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold text-text-primary">{total}</span>
        <span className="text-xs uppercase tracking-[0.22em] text-text-muted">ratings</span>
      </div>
    </div>
  );
}

export default function AdminAgentAnalyticsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const agentId = typeof params?.id === 'string' ? params.id : '';
  const [detail, setDetail] = useState<AgentAnalyticsDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryOverride, setCategoryOverride] = useState('');
  const [subcategoryOverride, setSubcategoryOverride] = useState('');

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${tokenStorage.getAccessToken() || ''}`,
      'Content-Type': 'application/json',
    }),
    []
  );

  useEffect(() => {
    if (!agentId) return;

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
        const response = await fetch(`/api/admin/agents/${agentId}/analytics`, {
          headers,
          credentials: 'include',
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to load skill analytics');
        }
        const payload = await response.json();
        if (!active) return;
        setDetail(payload.data);
        setCategoryOverride(payload.data.agent.categoryOverride || '');
        setSubcategoryOverride(payload.data.agent.subcategoryOverride || '');
        setIsLoading(false);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load skill analytics');
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [agentId, headers, router]);

  if (isLoading) {
    return <div className="sel-page p-6 text-sm text-text-secondary">Loading skill analytics...</div>;
  }

  if (!detail) {
    return <div className="sel-page p-6 text-sm text-error">{error || 'Skill analytics not found.'}</div>;
  }

  const { agent, downloads, feedback } = detail;
  const { category, subcategory } = getAgentCategory(agent);
  const subcategoryOptions = categoryOverride ? SUBCATEGORIES_BY_CATEGORY[categoryOverride] || [] : [];
  const maxDownload = Math.max(downloads.last7Days, downloads.last30Days, downloads.last365Days, downloads.overall, 1);

  const saveCategoryOverride = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/agents/${agent['agent id']}/category`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          categoryOverride,
          subcategoryOverride,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to save category override');
      }

      setDetail((current) =>
        current
          ? {
              ...current,
              agent: {
                ...current.agent,
                categoryOverride: categoryOverride || undefined,
                subcategoryOverride: subcategoryOverride || undefined,
              },
            }
          : current
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save category override');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="sel-page">
      <section className="relative overflow-hidden border-b border-border bg-[linear-gradient(135deg,color-mix(in_srgb,var(--bg-secondary)_96%,transparent),color-mix(in_srgb,var(--bg-primary)_100%,transparent))] px-4 py-16 text-text-primary">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(25,145,230,0.18),transparent_38%)]" />
        <div className="sel-shell relative z-10 max-w-6xl">
          <Link href="/admin/analytics" className="inline-flex items-center gap-2 text-text-secondary transition-colors hover:text-text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Analytics
          </Link>
          <div className="mt-6 flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-2">
                <span className="sel-badge bg-primary/10 text-primary">{category}</span>
                <span className="sel-badge bg-bg-tertiary text-text-primary">{agent.status}</span>
                {subcategory && <span className="sel-badge bg-bg-tertiary text-text-secondary">{subcategory}</span>}
              </div>
              <h1 className="mt-6 text-5xl font-bold leading-tight">{agent.name}</h1>
              <p className="mt-4 text-xl text-text-secondary">{agent.description}</p>
            </div>
            <div className="rounded-2xl border border-border bg-bg-primary/80 p-5 shadow-[0_0_30px_-20px_rgba(25,145,230,0.35)] backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Shield className="h-4 w-4" />
                Admin drilldown
              </div>
              <p className="mt-3 text-3xl font-semibold">{downloads.overall}</p>
              <p className="text-sm text-text-secondary">overall downloads</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-bg-primary px-4 py-10">
        <div className="sel-shell max-w-6xl space-y-8">
          {error && <div className="rounded-xl border border-error/20 bg-error/10 p-4 text-error">{error}</div>}

          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="sel-panel p-6 shadow-[0_0_30px_-24px_rgba(0,120,212,0.5)]">
              <div className="mb-6 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">Download Windows</h2>
              </div>

              <div className="grid gap-5 md:grid-cols-[1.12fr_0.88fr]">
                <div className="space-y-4">
                  {[
                    { label: 'Last 7 days', value: downloads.last7Days, color: 'from-info to-primary' },
                    { label: 'Last 30 days', value: downloads.last30Days, color: 'from-primary to-secondary' },
                    { label: 'Last 365 days', value: downloads.last365Days, color: 'from-secondary to-warning' },
                    { label: 'Overall', value: downloads.overall, color: 'from-success to-info' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-text-secondary">{item.label}</span>
                        <span className="font-semibold text-text-primary">{item.value}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-bg-tertiary">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                          style={{ width: `${Math.max((item.value / maxDownload) * 100, item.value > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-border bg-bg-secondary p-5">
                  <p className="text-sm text-text-secondary">Last download</p>
                  <p className="mt-3 text-base font-semibold text-text-primary">
                    {downloads.lastDownloaded ? new Date(downloads.lastDownloaded).toLocaleString() : 'Not downloaded yet'}
                  </p>
                  <div className="mt-5 border-t border-border pt-5">
                    <p className="text-sm text-text-secondary">Version</p>
                    <p className="mt-2 text-2xl font-semibold text-text-primary">v{agent.version}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sel-panel p-6 shadow-[0_0_30px_-24px_rgba(139,92,246,0.55)]">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">Category Override</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <select
                  value={categoryOverride}
                  onChange={(event) => {
                    setCategoryOverride(event.target.value);
                    setSubcategoryOverride('');
                  }}
                  className="sel-input px-4 py-3"
                >
                  <option value="">Use automatic category</option>
                  {CATEGORIES.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
                <select
                  value={subcategoryOverride}
                  onChange={(event) => setSubcategoryOverride(event.target.value)}
                  disabled={!categoryOverride}
                  className="sel-input px-4 py-3"
                >
                  <option value="">Use automatic subcategory</option>
                  {subcategoryOptions.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={saveCategoryOverride}
                  className="sel-button-primary px-4 py-3 text-sm"
                >
                  <Save className="h-4 w-4" />
                  Save
                </button>
              </div>

              {agent.analysis && (
                <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-5">
                  <h3 className="text-base font-semibold text-text-primary">NVIDIA analysis</h3>
                  <p className="mt-2 text-sm text-text-secondary">{agent.analysis.summary}</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
            <div className="sel-panel p-6 shadow-[0_0_30px_-24px_rgba(54,195,124,0.45)]">
              <div className="mb-5 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">Feedback Snapshot</h2>
              </div>
              <div className="flex flex-col items-center gap-6 md:flex-row">
                <FeedbackDonut distribution={feedback.distribution} />
                <div className="grid flex-1 gap-3">
                  <div className="rounded-2xl border border-border bg-bg-secondary p-4">
                    <p className="text-sm text-text-secondary">Average rating</p>
                    <p className="mt-2 text-3xl font-semibold text-text-primary">
                      {feedback.averageRating || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-bg-secondary p-4">
                    <p className="text-sm text-text-secondary">Total feedback</p>
                    <p className="mt-2 text-3xl font-semibold text-text-primary">
                      {feedback.totalFeedback}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-5 gap-3">
                {Object.entries(feedback.distribution)
                  .sort((a, b) => Number(b[0]) - Number(a[0]))
                  .map(([rating, count]) => (
                    <div key={rating} className="rounded-xl border border-border bg-bg-secondary p-3 text-center">
                      <p className="text-xs text-text-muted">{rating} star</p>
                      <p className="mt-1 text-xl font-semibold text-text-primary">{count}</p>
                    </div>
                  ))}
              </div>
            </div>

            <div className="sel-panel p-6">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">Recent Feedback</h2>
              </div>

              <div className="space-y-3">
                {feedback.feedbacks.length === 0 ? (
                  <div className="rounded-xl border border-border bg-bg-secondary p-4 text-sm text-text-secondary">
                    No feedback submitted for this skill yet.
                  </div>
                ) : (
                  feedback.feedbacks.map((item, index) => (
                    <div key={`${item.timestamp}-${index}`} className="rounded-2xl border border-border bg-bg-secondary p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{item.feature}</p>
                          <p className="text-xs text-text-muted">{new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                        <span className="sel-badge bg-primary/10 text-primary">{item.rating}/5</span>
                      </div>
                      <p className="mt-3 text-sm text-text-secondary">{item.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Skill ID', value: agent['agent id'] },
              { label: 'Primary specialization', value: agent.specialization.primary },
              { label: 'Tech stack', value: agent.technology.join(', ') || 'Not set' },
              { label: 'Demo video', value: agent.video_url ? 'Attached' : 'Empty slot' },
            ].map((item) => (
              <div key={item.label} className="sel-panel p-5">
                <p className="text-sm text-text-secondary">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-text-primary">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
