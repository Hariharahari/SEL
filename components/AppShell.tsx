'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  History,
  LogIn,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  SunMedium,
  Upload,
  User,
  X,
} from 'lucide-react';
import { useAuth, useIsAuthenticated, useUser } from '@/contexts/auth';
import { useTheme } from '@/contexts/theme';

interface AppShellProps {
  children: ReactNode;
}

const PUBLIC_ROUTES = new Set(['/login', '/admin/login']);

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, isLoading: authLoading } = useAuth();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isIgniteExpanded, setIsIgniteExpanded] = useState(true);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);

  const hideShell = pathname ? PUBLIC_ROUTES.has(pathname) : false;
  const isProtectedRoute =
    Boolean(pathname) && pathname !== '/' && !PUBLIC_ROUTES.has(pathname) && !pathname?.startsWith('/api');

  const navItems = useMemo(
    () => [
      { href: '/agents', label: 'Directory', icon: FolderOpen },
      { href: '/upload', label: 'Upload', icon: Upload },
      { href: '/submissions', label: 'My Submissions', icon: History },
      ...(String(user?.role || '').toUpperCase() === 'ADMIN'
        ? [{ href: '/admin/analytics', label: 'Admin Analytics', icon: Shield }]
        : []),
    ],
    [user?.role]
  );

  const pageTitle =
    pathname === '/upload'
      ? 'Upload'
      : pathname === '/submissions'
        ? 'My Submissions'
        : pathname?.startsWith('/admin')
          ? 'Admin'
          : 'Directory';

  const handleLogout = async () => {
    await logout();
    setIsProfileExpanded(false);
    router.push('/login');
  };

  useEffect(() => {
    if (!isAuthenticated || hideShell) return;

    const handlePopState = async () => {
      await logout();
      setIsProfileExpanded(false);
      router.replace('/login');
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hideShell, isAuthenticated, logout, router]);

  useEffect(() => {
    if (!isProtectedRoute || authLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, isProtectedRoute, router]);

  if (hideShell) {
    return <>{children}</>;
  }

  if (isProtectedRoute && (authLoading || !isAuthenticated)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="rounded-2xl border border-border bg-bg-secondary px-6 py-4 text-sm text-text-secondary">
          Checking your session...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      {isMobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border/50 bg-bg-secondary transition-all duration-300 md:static md:z-auto ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isSidebarOpen ? 'w-64' : 'w-16'}`}
      >
        <div className="flex h-12 items-center justify-between border-b border-border/50 px-3">
          <div className={`flex items-center gap-3 overflow-hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-0'}`}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white shadow-card">
              SI
            </div>
            {isSidebarOpen && <span className="truncate text-sm font-semibold text-text-primary">SEL Ignite</span>}
          </div>
          <button
            type="button"
            className="hidden rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-tertiary md:inline-flex"
            onClick={() => setIsSidebarOpen((value) => !value)}
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-tertiary md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <button
            type="button"
            onClick={() => {
              if (!isSidebarOpen) setIsSidebarOpen(true);
              setIsIgniteExpanded((value) => !value);
            }}
            className={`w-full rounded-lg px-3 py-2 text-left transition-all duration-200 ${
              isIgniteExpanded ? 'bg-primary/12 text-primary' : 'text-text-primary hover:bg-bg-tertiary'
            }`}
          >
            <span className="flex items-center gap-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FolderOpen className="h-4 w-4" />
              </span>
              {isSidebarOpen && (
                <>
                  <span className="flex-1 truncate text-sm font-medium">SEL Ignite</span>
                  {isIgniteExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </>
              )}
            </span>
          </button>

          {isSidebarOpen && isIgniteExpanded && (
            <div className="ml-5 mt-1 space-y-1 border-l-2 border-primary/20 pl-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors ${
                      isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-bg-tertiary'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-border/50 bg-bg-secondary px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-tertiary md:hidden"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-sm font-semibold leading-none text-text-primary">{pageTitle}</h1>
              <p className="mt-0.5 text-xs text-text-muted">SEL Ignite workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg-primary text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-text-primary transition-all hover:bg-bg-tertiary"
                onClick={() => setIsProfileExpanded((value) => !value)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-semibold text-white">
                  {user?.user_id?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden font-medium md:block">{user?.user_id || 'Profile'}</span>
                <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
              </button>

              {isProfileExpanded && (
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-border bg-bg-primary py-1 shadow-2xl">
                  <div className="px-4 py-2">
                    <p className="text-sm font-semibold text-text-primary">{user?.name || user?.user_id}</p>
                    <p className="text-xs text-text-secondary">{user?.email}</p>
                  </div>
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-text-primary transition-colors hover:bg-bg-tertiary"
                    onClick={() => {
                      setIsProfileExpanded(false);
                      router.push('/profile');
                    }}
                  >
                    <User className="h-4 w-4 text-text-muted" />
                    Profile
                  </button>
                  <button
                    type="button"
                    disabled={authLoading}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-error transition-colors hover:bg-error/10 disabled:opacity-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
            ) : (
            <Link href="/login" className="sel-button-primary px-4 py-2 text-sm">
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
