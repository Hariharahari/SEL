'use client';

import Link from 'next/link';
import { Home, FolderOpen, Upload } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <Link href="/" className="text-lg font-semibold text-gray-900">
              Agent Skills
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="
                flex items-center gap-2 text-gray-700 hover:text-blue-600
                transition-colors duration-200 font-medium
              "
            >
              <Home className="w-4 h-4" />
              Home
            </Link>

            <Link
              href="/agents"
              className="
                flex items-center gap-2 text-gray-700 hover:text-blue-600
                transition-colors duration-200 font-medium
              "
            >
              <FolderOpen className="w-4 h-4" />
              Directory
            </Link>

            <Link
              href="/upload"
              className="
                flex items-center gap-2 px-4 py-2 rounded-lg
                bg-blue-600 hover:bg-blue-700 text-white
                transition-colors duration-200 font-medium
              "
            >
              <Upload className="w-4 h-4" />
              Upload
            </Link>
          </div>

          {/* Mobile Menu Button (placeholder) */}
          <div className="md:hidden">
            <button className="p-2 text-gray-700 hover:text-blue-600">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
