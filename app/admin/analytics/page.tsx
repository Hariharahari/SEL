'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FolderOpen,
  PieChart,
  Shield,
  Sparkles,
  Trash2,
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
    inactive: number;
    pending: number;
    rejected: number;
    totalDownloads: number;
    downloadsLast7Days: number;
    downloadsLast30Days: number;
  };
  approved: SELAgentCard[];
  inactive: SELAgentCard[];
}

function StatusDonut({
  approved,
  pending,
  rejected,
}: {
  approved: number;
  pending: number;
  rejected: number;
}) {
  const total = Math.max(approved + pending + rejected, 1);
  const approvedPct = (approved / total) * 100;
  const pendingPct = (pending / total) * 100;

  return (
    <div className="relative h-44 w-44">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(#36c37c 0 ${approvedPct}%, #f4b740 ${approvedPct}% ${
            approvedPct + pendingPct
          }%, #f87171 ${approvedPct + pendingPct}% 100%)`,
        }}
      />
      <div className="absolute inset-[16px] rounded-full border border-border bg-bg-primary" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold text-text-primary">{total}</span>
        <span className="mt-1 text-xs uppercase tracking-[0.22em] text-text-muted">skills</span>
      </div>
    </div>
  );
}

function DownloadBars({
  totalDownloads,
  downloadsLast7Days,
  downloadsLast30Days,
}: {
  totalDownloads: number;
  downloadsLast7Days: number;
  downloadsLast30Days: number;
}) {
  const maxValue = Math.max(totalDownloads, downloadsLast30Days, downloadsLast7Days, 1);
  const bars = [
    { label: '7d', value: downloadsLast7Days, color: 'from-info to-primary' },
    { label: '30d', value: downloadsLast30Days, color: 'from-primary to-secondary' },
    { label: 'overall', value: totalDownloads, color: 'from-success to-info' },
  ];

  return (
    <div className="space-y-4">
      {bars.map((bar) => (
        <div key={bar.label}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-text-secondary">{bar.label}</span>
            <span className="font-medium text-text-primary">{bar.value}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-bg-tertiary">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${bar.color}`}
              style={{ width: `${Math.max((bar.value / maxValue) * 100, bar.value > 0 ? 8 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
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

  const handleDeleteApproved = async (skillId: string, skillName: string) => {
    const confirmed = window.confirm(
      `Mark the approved skill "${skillName}" as inactive and remove it from the live directory?`
    );
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/agents/${skillId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to mark approved skill inactive');
      }
      await loadData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : 'Failed to mark approved skill inactive'
      );
    }
  };

  if (isLoading) {
    return <div className="sel-page p-6 text-sm text-text-secondary">Loading admin analytics...</div>;
  }

  const summary = analytics?.summary || {
    approved: 0,
    inactive: 0,
    pending: 0,
    rejected: 0,
    totalDownloads: 0,
    downloadsLast7Days: 0,
    downloadsLast30Days: 0,
  };

  return (
    <div className="sel-page p-6">
      <div className="sel-shell space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-border bg-[linear-gradient(135deg,color-mix(in_srgb,var(--bg-secondary)_96%,transparent),color-mix(in_srgb,var(--bg-primary)_100%,transparent))] p-8 shadow-[0_0_50px_-30px_rgba(25,145,230,0.25)]">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Skill operations
              </div>
              <h1 className="mt-5 text-4xl font-semibold text-text-primary">Admin Analytics</h1>
              <p className="mt-3 text-base text-text-secondary">
                Review the live skill catalog, approval flow, and usage patterns in one visual workspace.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-bg-primary/70 px-4 py-3 text-sm text-text-secondary">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Central-auth protected
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-error/20 bg-error/10 p-4 text-sm text-error">
              {error}
            </div>
          )}

          <div className="mt-8 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-[24px] border border-border bg-bg-primary/70 p-6">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">Approval Mix</h2>
              </div>
              <div className="mt-6 flex flex-col items-center gap-6 md:flex-row">
                <StatusDonut
                  approved={summary.approved}
                  pending={summary.pending}
                  rejected={summary.rejected}
                />
                <div className="grid flex-1 gap-3">
                  {[
                    { label: 'Approved', value: summary.approved, icon: CheckCircle2, color: 'text-success', href: '/admin/history/approved' },
                    { label: 'Inactive', value: summary.inactive, icon: FolderOpen, color: 'text-text-secondary', href: '/admin/history/inactive' },
                    { label: 'Pending', value: summary.pending, icon: Clock3, color: 'text-warning', href: '/admin/history/pending' },
                    { label: 'Rejected', value: summary.rejected, icon: XCircle, color: 'text-error', href: '/admin/history/rejected' },
                  ].map(({ label, value, icon: Icon, color, href }) => (
                    <Link
                      key={label}
                      href={href}
                      className="flex items-center justify-between rounded-2xl border border-border bg-bg-primary/60 px-4 py-3 transition-all hover:border-primary"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${color}`} />
                        <span className="text-sm text-text-secondary">{label}</span>
                      </div>
                      <span className="text-lg font-semibold text-text-primary">{value}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-border bg-bg-primary/70 p-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">Download Momentum</h2>
              </div>
              <div className="mt-6 grid gap-6 md:grid-cols-[0.72fr_1.28fr]">
                <div className="rounded-2xl border border-border bg-bg-primary/60 p-5">
                  <p className="text-sm text-text-secondary">Total tracked downloads</p>
                  <p className="mt-3 text-4xl font-semibold text-text-primary">
                    {summary.totalDownloads}
                  </p>
                  <Link
                    href="/admin/history/downloads"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary"
                  >
                    Open history
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <DownloadBars
                  totalDownloads={summary.totalDownloads}
                  downloadsLast7Days={summary.downloadsLast7Days}
                  downloadsLast30Days={summary.downloadsLast30Days}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-border bg-bg-secondary/85 p-6 shadow-[0_0_30px_-24px_rgba(0,120,212,0.4)]">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-text-primary">Active Skill Directory</h2>
            </div>
            <span className="text-sm text-text-secondary">
              Page {approvedPage} of {approvedPageCount}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {approvedSlice.map((agent) => {
              const { category, subcategory } = getAgentCategory(agent);
              const maxDownloads = Math.max(
                ...approvedAgents.map((item) => item.downloads?.total_download_overall || 0),
                1
              );
              const overallDownloads = agent.downloads?.total_download_overall || 0;
              const progress = (overallDownloads / maxDownloads) * 100;

              return (
                <div
                  key={agent['agent id']}
                  className="rounded-[24px] border border-border bg-bg-primary p-5 shadow-[0_0_24px_-22px_rgba(0,120,212,0.65)] transition-all duration-200 hover:border-primary hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="sel-badge bg-primary/10 text-primary">{category}</span>
                        <span className="sel-badge bg-bg-tertiary text-text-secondary">{agent.status}</span>
                      </div>
                      <Link
                        href={`/admin/analytics/${agent['agent id']}`}
                        className="mt-4 block text-lg font-semibold text-text-primary transition-colors hover:text-primary"
                      >
                        {agent.name}
                      </Link>
                      <p className="mt-1 text-sm text-text-secondary">{subcategory}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/analytics/${agent['agent id']}`}
                        className="sel-button-ghost border border-border px-3 py-2 text-sm"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteApproved(agent['agent id'], agent.name)}
                        className="sel-button-ghost border border-error/40 px-3 py-2 text-sm text-error hover:bg-error/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        Inactive
                      </button>
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-2 text-sm text-text-secondary">{agent.description}</p>

                  <div className="mt-5 rounded-2xl border border-border bg-bg-secondary p-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Overall downloads</span>
                      <span className="font-semibold text-text-primary">{overallDownloads}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-bg-tertiary">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                        style={{ width: `${Math.max(progress, overallDownloads > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-text-muted">7d</p>
                        <p className="mt-1 font-semibold text-text-primary">
                          {agent.downloads?.total_download_7_days || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">30d</p>
                        <p className="mt-1 font-semibold text-text-primary">
                          {agent.downloads?.total_download_30_days || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Version</p>
                        <p className="mt-1 font-semibold text-text-primary">v{agent.version}</p>
                      </div>
                    </div>
                  </div>
                </div>
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

        <section className="rounded-[28px] border border-border bg-bg-secondary/85 p-6 shadow-[0_0_30px_-24px_rgba(100,116,139,0.18)]">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-text-secondary" />
              <h2 className="text-lg font-semibold text-text-primary">Inactive Skills</h2>
            </div>
            <span className="text-sm text-text-secondary">{analytics?.inactive.length || 0} archived</span>
          </div>

          {(analytics?.inactive || []).length === 0 ? (
            <div className="rounded-2xl border border-border bg-bg-primary p-5 text-sm text-text-secondary">
              No inactive skills right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(analytics?.inactive || []).map((agent) => (
                <div key={agent['agent id']} className="rounded-[24px] border border-border bg-bg-primary p-5 opacity-85">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="sel-badge bg-bg-tertiary text-text-secondary">inactive</span>
                        <span className="sel-badge bg-bg-tertiary text-text-secondary">{agent.status}</span>
                      </div>
                      <p className="mt-4 text-lg font-semibold text-text-primary">{agent.name}</p>
                      <p className="mt-1 text-sm text-text-secondary">{agent.description}</p>
                    </div>
                    <span className="text-xs text-text-muted">
                      {agent.inactiveAt ? new Date(agent.inactiveAt).toLocaleDateString() : 'archived'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-border bg-bg-secondary/85 p-6 shadow-[0_0_30px_-24px_rgba(139,92,246,0.4)]">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-warning" />
              <h2 className="text-lg font-semibold text-text-primary">Pending Uploads</h2>
            </div>
            <span className="text-sm text-text-secondary">
              Page {pendingPage} of {pendingPageCount}
            </span>
          </div>

          <div className="grid gap-4">
            {pendingSlice.length === 0 ? (
              <div className="rounded-2xl border border-border bg-bg-primary p-5 text-sm text-text-secondary">
                No uploads are waiting for review.
              </div>
            ) : (
              pendingSlice.map((record) => (
                <div
                  key={record.agent['agent id']}
                  className="rounded-[24px] border border-border bg-bg-primary p-5 shadow-[0_0_22px_-20px_rgba(244,183,64,0.8)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <Link
                        href={`/admin/review/${record.agent['agent id']}`}
                        className="text-lg font-semibold text-text-primary transition-colors hover:text-primary"
                      >
                        {record.agent.name}
                      </Link>
                      <p className="mt-2 max-w-3xl text-sm text-text-secondary">
                        {record.agent.description}
                      </p>
                      <p className="mt-3 text-xs text-text-muted">
                        {record.agent.origin.org} • submitted{' '}
                        {new Date(record.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-3">
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
