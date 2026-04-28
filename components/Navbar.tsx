'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Home, FolderOpen, Upload, LogOut, User, Menu, X } from 'lucide-react';
import { useAuth, useUser, useIsAuthenticated } from '@/contexts/auth';

export default function Navbar() {
  const router = useRouter();
  const { logout, isLoading: authLoading } = useAuth();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-menu]') && !target.closest('[data-user-menu]')) {
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <Link href="/" className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
              Agent Directory
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>

            <Link
              href="/agents"
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              <FolderOpen className="w-4 h-4" />
              Directory
            </Link>

            {isAuthenticated && (
              <Link
                href="/upload"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 font-medium"
              >
                <Upload className="w-4 h-4" />
                Upload
              </Link>
            )}
          </div>

          {/* Right Side: Auth Section */}
          <div className="flex items-center gap-4">
            {/* Desktop Auth UI */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-4">
                {/* User Profile Button */}
                <div className="relative" data-user-menu>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user?.user_id?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user?.user_id}</span>
                    <svg
                      className={`w-4 h-4 text-gray-600 transition-transform ${
                        isUserMenuOpen ? 'rotate-180' : ''
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user?.name || user?.user_id}</p>
                        <p className="text-xs text-gray-600">{user?.email}</p>
                        <p className="text-xs text-blue-600 font-medium mt-1 capitalize">{user?.role} User</p>
                      </div>

                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>

                      <button
                        onClick={handleLogout}
                        disabled={authLoading}
                        className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 font-medium"
              >
                <User className="w-4 h-4" />
                Sign In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              data-menu
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-3" data-menu>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
              onClick={() => setIsMenuOpen(false)}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>

            <Link
              href="/agents"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
              onClick={() => setIsMenuOpen(false)}
            >
              <FolderOpen className="w-4 h-4" />
              Directory
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  href="/upload"
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </Link>

                <div className="border-t border-gray-200 pt-3">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>

                  <button
                    onClick={handleLogout}
                    disabled={authLoading}
                    className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}

            {!isAuthenticated && (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium w-full justify-center"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
