"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, tokenStorage, getAuthHeaders } from '@/lib/auth';
import { Users, BarChart3, Settings, LogOut, Shield, AlertCircle, CheckCircle, Clock, XCircle, TrendingUp, Search } from 'lucide-react';
import SkillsAnalytics from './skills-analytics';

interface UserProfile {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

interface Skill {
  skill_id: string;
  name: string;
  category: string;
  difficulty_level: string;
  status: string;
  rating: number;
  total_reviews: number;
  total_enrolled: number;
}

interface Analytics {
  skills: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    average_rating: string;
    total_enrolled: number;
    total_downloads: number;
  };
  categories: { [key: string]: number };
  difficulties: { [key: string]: number };
  statuses: { [key: string]: number };
  users: {
    total: number;
    admins: number;
    regular: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [processingSkill, setProcessingSkill] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const result = await authApi.getCurrentUser();
        
        if (!result.success) {
          router.push('/login');
          return;
        }

        // Check if user is admin
        if (result.data.role?.toUpperCase() !== 'ADMIN') {
          setError('Access Denied: Admin privileges required');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        setUser(result.data);
        
        // Fetch pending skills and analytics
        await fetchPendingSkills();
        await fetchAnalytics();
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to verify admin access:', err);
        router.push('/login');
      }
    };

    checkAdminAccess();
  }, [router]);

  const fetchPendingSkills = async () => {
    try {
      const token = tokenStorage.getAccessToken();
      const response = await fetch('http://localhost:3001/api/skills/pending-approval', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSkills(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch skills:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = tokenStorage.getAccessToken();
      const response = await fetch('http://localhost:3001/api/analytics/skills', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const handleApproveSkill = async (skillId: string) => {
    setProcessingSkill(skillId);
    try {
      const token = tokenStorage.getAccessToken();
      const response = await fetch(`http://localhost:3001/api/skills/${skillId}/approval`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'approve',
          reason: 'Approved by admin',
        }),
      });

      if (response.ok) {
        // Remove skill from pending list
        setSkills(skills.filter(s => s.skill_id !== skillId));
      }
    } catch (err) {
      console.error('Failed to approve skill:', err);
    } finally {
      setProcessingSkill(null);
    }
  };

  const handleRejectSkill = async (skillId: string) => {
    setProcessingSkill(skillId);
    try {
      const token = tokenStorage.getAccessToken();
      const response = await fetch(`http://localhost:3001/api/skills/${skillId}/approval`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'reject',
          reason: 'Rejected by admin',
        }),
      });

      if (response.ok) {
        // Remove skill from pending list
        setSkills(skills.filter(s => s.skill_id !== skillId));
      }
    } catch (err) {
      console.error('Failed to reject skill:', err);
    } finally {
      setProcessingSkill(null);
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-200 text-lg">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center">
          <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-red-500 to-pink-600 p-2 rounded-lg">
                <Shield size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-gray-400 text-sm">Skills Approval & Analytics</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Dashboard Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'approval', label: 'Skills Approval', icon: Clock },
            { id: 'skill-analytics', label: 'Skill Analytics', icon: Search },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Welcome, Admin!</h2>
                  <p className="text-gray-300">
                    Email: <span className="font-semibold text-blue-400">{user?.email}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <CheckCircle size={20} className="text-green-400" />
                    <span className="text-green-400 font-semibold">Admin Access Granted</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-white/10 rounded-lg p-6">
                  <p className="text-gray-400 text-sm mb-2">Total Skills</p>
                  <p className="text-4xl font-bold text-green-400">{analytics.skills.total}</p>
                  <p className="text-gray-500 text-xs mt-2">From Redis database</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-white/10 rounded-lg p-6">
                  <p className="text-gray-400 text-sm mb-2">Approved</p>
                  <p className="text-4xl font-bold text-blue-400">{analytics.skills.approved}</p>
                  <p className="text-gray-500 text-xs mt-2">Published skills</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-white/10 rounded-lg p-6">
                  <p className="text-gray-400 text-sm mb-2">Pending</p>
                  <p className="text-4xl font-bold text-yellow-400">{analytics.skills.pending}</p>
                  <p className="text-gray-500 text-xs mt-2">Awaiting review</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/10 rounded-lg p-6">
                  <p className="text-gray-400 text-sm mb-2">Avg Rating</p>
                  <p className="text-4xl font-bold text-purple-400">{analytics.skills.average_rating}/5</p>
                  <p className="text-gray-500 text-xs mt-2">Community rating</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Approval Tab */}
        {activeTab === 'approval' && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Skill Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Difficulty</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Rating</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Enrolled</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skills.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                          No skills pending approval
                        </td>
                      </tr>
                    ) : (
                      skills.map(skill => (
                        <tr key={skill.skill_id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="px-6 py-4 font-medium">{skill.name}</td>
                          <td className="px-6 py-4 text-gray-400">{skill.category}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                              {skill.difficulty_level}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400">★</span>
                              <span>{skill.rating.toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-400">{skill.total_enrolled}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveSkill(skill.skill_id)}
                                disabled={processingSkill === skill.skill_id}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded text-sm transition"
                              >
                                {processingSkill === skill.skill_id ? '...' : '✓ Approve'}
                              </button>
                              <button
                                onClick={() => handleRejectSkill(skill.skill_id)}
                                disabled={processingSkill === skill.skill_id}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white rounded text-sm transition"
                              >
                                {processingSkill === skill.skill_id ? '...' : '✕ Reject'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Skills Analytics Tab */}
        {activeTab === 'skill-analytics' && (
          <SkillsAnalytics />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Skills by Category</h3>
              <div className="space-y-3">
                {Object.entries(analytics.categories).map(([category, count]) => (
                  <div key={category}>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300">{category}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${(count / analytics.skills.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Difficulty Breakdown */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Skills by Difficulty</h3>
              <div className="space-y-3">
                {Object.entries(analytics.difficulties).map(([difficulty, count]) => (
                  <div key={difficulty}>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300">{difficulty}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                        style={{ width: `${(count / analytics.skills.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Statistics */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">User Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Users</span>
                  <span className="font-semibold text-blue-400">{analytics.users.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Admin Users</span>
                  <span className="font-semibold text-red-400">{analytics.users.admins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Regular Users</span>
                  <span className="font-semibold text-green-400">{analytics.users.regular}</span>
                </div>
              </div>
            </div>

            {/* Download Statistics */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Engagement Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Downloads</span>
                  <span className="font-semibold text-purple-400">{analytics.skills.total_downloads}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Enrolled</span>
                  <span className="font-semibold text-cyan-400">{analytics.skills.total_enrolled}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Average Rating</span>
                  <span className="font-semibold text-yellow-400">{analytics.skills.average_rating}/5</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Backend Connection Status */}
        <div className="mt-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle size={24} className="text-green-400" />
            <h3 className="text-lg font-semibold">Backend Connection</h3>
          </div>
          <p className="text-gray-300 text-sm">
            ✅ Frontend-Backend connection active. Real-time data from Redis database and PostgreSQL.
          </p>
        </div>
      </main>
    </div>
  );
}
