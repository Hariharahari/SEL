'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FolderOpen,
  Shield,
  XCircle,
} from 'lucide-react';
import { authApi, tokenStorage } from '@/lib/auth';
import { getAgentCategory } from '@/lib/agentCategory';
import type { SELAgentCard } from '@/types';

const AGENTS_PER_PAGE = 10;

interface PendingAgentRecord {
  agent: SELAgentCard;
  submittedAt: string;
}

interface AnalyticsResponse {
  summary: {
    approved: number;
    pending: number;
    rejected: number;
    totalDownloads: number;
    downloadsLast7Days: number;
    downloadsLast30Days: number;
  };
  approved: SELAgentCard[];
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [pendingAgents, setPendingAgents] = useState<PendingAgentRecord[]>([]);
  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${tokenStorage.getAccessToken() || ''}`,
      'Content-Type': 'application/json',
    }),
    []
  );

  const loadData = async () => {
    const [analyticsResponse, pendingResponse] = await Promise.all([
      fetch('/api/admin/agents/analytics', { headers, credentials: 'include' }),
      fetch('/api/admin/agents/pending', { headers, credentials: 'include' }),
    ]);

    if (analyticsResponse.status === 401 || pendingResponse.status === 401) {
      router.push('/login');
      return;
    }

    if (analyticsResponse.status === 403 || pendingResponse.status === 403) {
      setError('Admin access is required for this page.');
      setIsLoading(false);
      return;
    }

    const analyticsPayload = await analyticsResponse.json();
    const pendingPayload = await pendingResponse.json();
    setAnalytics(analyticsPayload.data);
    setPendingAgents(pendingPayload.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    let active = true;

    authApi.getCurrentUser().then((result) => {
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

      loadData().catch((loadError) => {
        console.error(loadError);
        setError('Failed to load admin analytics.');
        setIsLoading(false);
      });
    });

    return () => {
      active = false;
    };
  }, [router]);

  const approvedAgents = analytics?.approved || [];
  const approvedSlice = approvedAgents.slice(
    (approvedPage - 1) * AGENTS_PER_PAGE,
    approvedPage * AGENTS_PER_PAGE
  );
  const pendingSlice = pendingAgents.slice(
    (pendingPage - 1) * AGENTS_PER_PAGE,
    pendingPage * AGENTS_PER_PAGE
  );
  const approvedPageCount = Math.max(1, Math.ceil(approvedAgents.length / AGENTS_PER_PAGE));
  const pendingPageCount = Math.max(1, Math.ceil(pendingAgents.length / AGENTS_PER_PAGE));

  const handleApprove = async (skillId: string) => {
    try {
      const response = await fetch(`/api/admin/agents/${skillId}/approve`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to approve skill');
      }
      await loadData();
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : 'Failed to approve skill');
    }
  };

  const handleReject = async (skillId: string) => {
    const reason = window.prompt('Enter the reason for rejecting this skill:');
    if (!reason || !reason.trim()) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/agents/${skillId}/reject`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ rejectionReason: reason.trim() }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to reject skill');
      }
      await loadData();
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : 'Failed to reject skill');
    }
  };

  if (isLoading) {
    return <div className="sel-page p-6 text-sm text-text-secondary">Loading admin analytics...</div>;
  }

  return (
    <div className="sel-page p-6">
      <div className="sel-shell space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Admin Analytics</h1>
            <p className="mt-1 max-w-3xl text-sm text-text-secondary">
              Browse approved skills like the directory, review pending submissions, and open a specific skill to inspect downloads, feedback, category overrides, and detailed analytics.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-secondary px-4 py-2 text-sm text-text-secondary">
            <Shield className="h-4 w-4 text-primary" />
            Central-auth protected
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-error/20 bg-error/10 p-4 text-sm text-error">
            {error}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Approved', value: analytics?.summary.approved || 0, icon: CheckCircle2, accent: 'text-success', href: '/admin/history/approved' },
            { label: 'Pending', value: analytics?.summary.pending || 0, icon: Clock3, accent: 'text-warning', href: '/admin/history/pending' },
            { label: 'Rejected', value: analytics?.summary.rejected || 0, icon: XCircle, accent: 'text-error', href: '/admin/history/rejected' },
            { label: 'Downloads', value: analytics?.summary.totalDownloads || 0, icon: Download, accent: 'text-primary', href: '/admin/history/downloads' },
          ].map(({ label, value, icon: Glyph, accent, href }) => (
            <Link key={label} href={href} className="sel-panel p-5 transition-all duration-200 hover:border-primary hover:shadow-card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">{label}</p>
                  <p className="mt-2 text-3xl font-semibold text-text-primary">{value}</p>
                </div>
                <Glyph className={`h-5 w-5 ${accent}`} />
              </div>
            </Link>
          ))}
        </section>

        <section className="sel-panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-text-primary">Approved Skill Directory</h2>
            </div>
            <span className="text-sm text-text-secondary">
              Page {approvedPage} of {approvedPageCount}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {approvedSlice.map((agent) => {
              const { category, subcategory } = getAgentCategory(agent);
              return (
                <Link
                  key={agent['agent id']}
                  href={`/admin/analytics/${agent['agent id']}`}
                  className="rounded-2xl border border-border bg-bg-primary p-5 transition-all duration-200 hover:border-primary hover:shadow-card-hover"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="sel-badge bg-primary/10 text-primary">{category}</span>
                        <span className="sel-badge bg-bg-tertiary text-text-secondary">{agent.status}</span>
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-text-primary">{agent.name}</h3>
                      <p className="mt-1 text-sm text-text-secondary">{subcategory}</p>
                    </div>
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <p className="mt-4 line-clamp-2 text-sm text-text-secondary">{agent.description}</p>
                  <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-xl border border-border bg-bg-secondary p-3">
                      <p className="text-xs text-text-muted">7 days</p>
                      <p className="mt-1 font-semibold text-text-primary">{agent.downloads?.total_download_7_days || 0}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-bg-secondary p-3">
                      <p className="text-xs text-text-muted">30 days</p>
                      <p className="mt-1 font-semibold text-text-primary">{agent.downloads?.total_download_30_days || 0}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-bg-secondary p-3">
                      <p className="text-xs text-text-muted">Overall</p>
                      <p className="mt-1 font-semibold text-text-primary">{agent.downloads?.total_download_overall || 0}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {approvedAgents.length > AGENTS_PER_PAGE && (
            <div className="mt-5 flex items-center justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setApprovedPage((value) => Math.max(1, value - 1))}
                disabled={approvedPage === 1}
                className="sel-button-ghost border border-border px-3 py-2 text-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setApprovedPage((value) => Math.min(approvedPageCount, value + 1))}
                disabled={approvedPage === approvedPageCount}
                className="sel-button-ghost border border-border px-3 py-2 text-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>

        <section className="sel-panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-warning" />
              <h2 className="text-lg font-semibold text-text-primary">Pending Uploads</h2>
            </div>
            <span className="text-sm text-text-secondary">
              Page {pendingPage} of {pendingPageCount}
            </span>
          </div>

          <div className="space-y-4">
            {pendingSlice.length === 0 ? (
              <div className="rounded-xl border border-border bg-bg-primary p-4 text-sm text-text-secondary">
                No uploads are waiting for review.
              </div>
            ) : (
              pendingSlice.map((record) => (
                <div key={record.agent['agent id']} className="rounded-xl border border-border bg-bg-primary p-4">
                  <Link
                    href={`/admin/review/${record.agent['agent id']}`}
                    className="text-base font-semibold text-text-primary hover:text-primary"
                  >
                    {record.agent.name}
                  </Link>
                  <p className="mt-1 text-sm text-text-secondary">{record.agent.description}</p>
                  <p className="mt-2 text-xs text-text-muted">
                    {record.agent.origin.org} - submitted {new Date(record.submittedAt).toLocaleString()}
                  </p>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleApprove(record.agent['agent id'])}
                      className="sel-button-primary px-4 py-2 text-sm"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(record.agent['agent id'])}
                      className="sel-button-ghost border border-error/40 px-4 py-2 text-sm text-error hover:bg-error/10"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {pendingAgents.length > AGENTS_PER_PAGE && (
            <div className="mt-5 flex items-center justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setPendingPage((value) => Math.max(1, value - 1))}
                disabled={pendingPage === 1}
                className="sel-button-ghost border border-border px-3 py-2 text-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPendingPage((value) => Math.min(pendingPageCount, value + 1))}
                disabled={pendingPage === pendingPageCount}
                className="sel-button-ghost border border-border px-3 py-2 text-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
