'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { authApi, tokenStorage } from '@/lib/auth';

type HistoryKind = 'approved' | 'pending' | 'rejected' | 'downloads';

export default function AdminHistoryPage() {
  const params = useParams<{ kind: string }>();
  const router = useRouter();
  const kind = (params?.kind || 'approved') as HistoryKind;
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${tokenStorage.getAccessToken() || ''}`,
      'Content-Type': 'application/json',
    }),
    []
  );

  useEffect(() => {
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
        const response = await fetch(`/api/admin/history/${kind}`, {
          headers,
          credentials: 'include',
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to load admin history');
        }
        const payload = await response.json();
        if (!active) return;
        setData(payload.data || []);
        setIsLoading(false);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load admin history');
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [headers, kind, router]);

  if (isLoading) {
    return <div className="sel-page p-6 text-sm text-text-secondary">Loading history...</div>;
  }

  const title = {
    approved: 'Approved Skills History',
    pending: 'Pending Skills History',
    rejected: 'Rejected Skills History',
    downloads: 'Download History',
  }[kind];

  return (
    <div className="sel-page p-6">
      <div className="sel-shell max-w-6xl space-y-6">
        <div>
          <Link href="/admin/analytics" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Analytics
          </Link>
          <h1 className="mt-4 text-3xl font-semibold text-text-primary">{title}</h1>
        </div>

        {error && <div className="rounded-xl border border-error/20 bg-error/10 p-4 text-error">{error}</div>}

        <div className="space-y-4">
          {data.length === 0 ? (
            <div className="sel-panel p-5 text-sm text-text-secondary">No history found.</div>
          ) : (
            data.map((item, index) => (
              <div key={index} className="sel-panel p-5">
                {kind === 'downloads' ? (
                  <>
                    <h2 className="text-lg font-semibold text-text-primary">{item.skillName}</h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      {item.user.email} - {item.purpose} - {new Date(item.downloadedAt).toLocaleString()}
                    </p>
                    <p className="mt-2 text-xs text-text-muted">
                      BG: {item.user.businessGroup || 'N/A'} - ISU: {item.user.IOU || 'N/A'} - Account: {item.user.account || 'N/A'}
                    </p>
                  </>
                ) : kind === 'approved' ? (
                  <>
                    <Link href={`/admin/analytics/${item.agent['agent id']}`} className="text-lg font-semibold text-text-primary hover:text-primary">
                      {item.agent.name}
                    </Link>
                    <p className="mt-1 text-sm text-text-secondary">{item.agent.description}</p>
                    <p className="mt-2 text-xs text-text-muted">
                      Downloads: {item.agent.downloads?.total_download_overall || 0}
                    </p>
                  </>
                ) : kind === 'pending' ? (
                  <>
                    <Link href={`/admin/review/${item.agent['agent id']}`} className="text-lg font-semibold text-text-primary hover:text-primary">
                      {item.agent.name}
                    </Link>
                    <p className="mt-1 text-sm text-text-secondary">{item.agent.description}</p>
                    <p className="mt-2 text-xs text-text-muted">
                      Submitted by {item.submittedBy || 'Unknown'} on {new Date(item.submittedAt).toLocaleString()}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-text-primary">{item.agent.name}</h2>
                    <p className="mt-1 text-sm text-text-secondary">{item.agent.description}</p>
                    <p className="mt-2 text-sm text-error">Reason: {item.rejectionReason}</p>
                    <p className="mt-2 text-xs text-text-muted">
                      Rejected by {item.rejectedBy || 'Unknown'} on {new Date(item.rejectedAt).toLocaleString()}
                    </p>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
