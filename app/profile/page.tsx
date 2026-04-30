'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Shield, User } from 'lucide-react';
import { authApi } from '@/lib/auth';
import { useUser } from '@/contexts/auth';

export default function ProfilePage() {
  const router = useRouter();
  const user = useUser();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let active = true;

    authApi.getCurrentUser().then((result) => {
      if (!active) return;
      if (!result.success) {
        router.push('/login');
        return;
      }
      setIsChecking(false);
    });

    return () => {
      active = false;
    };
  }, [router]);

  if (isChecking) {
    return <div className="p-6 text-sm text-text-secondary">Loading profile...</div>;
  }

  return (
    <div className="sel-page p-6">
      <div className="sel-shell max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Profile</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Your current SEL Ignite account details from central authentication.
          </p>
        </div>

        <div className="sel-card p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xl font-semibold text-white">
              {user?.user_id?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">{user?.name || user?.user_id}</h2>
              <p className="text-sm text-text-secondary">{user?.user_id}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-bg-primary p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
                <Mail className="h-4 w-4 text-primary" />
                Email
              </div>
              <p className="text-sm text-text-secondary">{user?.email || 'Not available'}</p>
            </div>

            <div className="rounded-xl border border-border bg-bg-primary p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
                <Shield className="h-4 w-4 text-primary" />
                Role
              </div>
              <p className="text-sm capitalize text-text-secondary">{String(user?.role || 'user').toLowerCase()}</p>
            </div>

            <div className="rounded-xl border border-border bg-bg-primary p-4 md:col-span-2">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
                <User className="h-4 w-4 text-primary" />
                Session
              </div>
              <p className="text-sm text-text-secondary">
                This page is backed by the same JWT-based central auth flow used across the portal shell and integrated starter-kit APIs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
