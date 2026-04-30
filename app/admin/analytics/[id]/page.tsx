'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, Download, MessageSquare, Save, Shield } from 'lucide-react';
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
          throw new Error(payload.error || 'Failed to load agent analytics');
        }
        const payload = await response.json();
        if (!active) return;
        setDetail(payload.data);
        setCategoryOverride(payload.data.agent.categoryOverride || '');
        setSubcategoryOverride(payload.data.agent.subcategoryOverride || '');
        setIsLoading(false);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load agent analytics');
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
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-[#2443b9] to-[#152347] px-4 py-16 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.22),rgba(255,255,255,0))]" />
        </div>
        <div className="sel-shell relative z-10 max-w-6xl">
          <Link href="/admin/analytics" className="inline-flex items-center gap-2 text-white/90 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Analytics
          </Link>
          <div className="mt-6 flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-2">
                <span className="sel-badge bg-white/15 text-white">{category}</span>
                <span className="sel-badge bg-white/15 text-white">{agent.status}</span>
                {subcategory && <span className="sel-badge bg-white/10 text-white/85">{subcategory}</span>}
              </div>
              <h1 className="mt-6 text-5xl font-bold leading-tight">{agent.name}</h1>
              <p className="mt-4 text-xl text-white/85">{agent.description}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm text-white/85">
                <Shield className="h-4 w-4" />
                Admin drilldown
              </div>
              <p className="mt-3 text-3xl font-semibold">{downloads.overall}</p>
              <p className="text-sm text-white/75">overall downloads</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-bg-primary px-4 py-10">
        <div className="sel-shell max-w-6xl space-y-8">
          {error && <div className="rounded-xl border border-error/20 bg-error/10 p-4 text-error">{error}</div>}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              { label: 'Last 7 days', value: downloads.last7Days },
              { label: 'Last 30 days', value: downloads.last30Days },
              { label: 'Last 365 days', value: downloads.last365Days },
              { label: 'Overall', value: downloads.overall },
              { label: 'Feedback avg', value: feedback.averageRating || 0 },
            ].map((item) => (
              <div key={item.label} className="sel-panel p-5">
                <p className="text-sm text-text-secondary">{item.label}</p>
                <p className="mt-2 text-3xl font-semibold text-text-primary">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_1.35fr]">
            <div className="sel-panel p-6">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
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

            <div className="sel-panel p-6">
              <div className="mb-4 flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">Download Activity</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-bg-secondary p-4">
                  <p className="text-sm text-text-secondary">Last download</p>
                  <p className="mt-2 text-base font-semibold text-text-primary">
                    {downloads.lastDownloaded ? new Date(downloads.lastDownloaded).toLocaleString() : 'Not downloaded yet'}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-bg-secondary p-4">
                  <p className="text-sm text-text-secondary">Version</p>
                  <p className="mt-2 text-base font-semibold text-text-primary">{agent.version}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="sel-panel p-6">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-text-primary">Feedback</h2>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-5">
              {Object.entries(feedback.distribution).map(([rating, count]) => (
                <div key={rating} className="rounded-xl border border-border bg-bg-secondary p-4">
                  <p className="text-sm text-text-secondary">{rating} star</p>
                  <p className="mt-2 text-2xl font-semibold text-text-primary">{count}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {feedback.feedbacks.length === 0 ? (
                <div className="rounded-xl border border-border bg-bg-secondary p-4 text-sm text-text-secondary">
                  No feedback submitted for this agent yet.
                </div>
              ) : (
                feedback.feedbacks.map((item, index) => (
                  <div key={`${item.timestamp}-${index}`} className="rounded-xl border border-border bg-bg-secondary p-4">
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
      </section>
    </div>
  );
}
