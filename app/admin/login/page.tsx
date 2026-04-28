"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function AdminLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main login with info
    const timer = setTimeout(() => {
      router.push('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <ArrowRight className="text-white" size={32} />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-3">Admin Portal</h1>
          <p className="text-gray-300 mb-6">
            Please use the main login page for all users, including admins.
          </p>
          
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
            <p className="text-green-300 text-sm">
              ✅ The system will automatically redirect you to the admin dashboard if you have admin privileges.
            </p>
          </div>

          <button
            onClick={() => router.push('/login')}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition mb-3"
          >
            Go to Login
          </button>

          <p className="text-gray-400 text-xs">
            Redirecting automatically in 3 seconds...
          </p>
        </div>
      </div>
    </div>
  );
}
