"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/auth';
import { 
  Search, 
  X, 
  BarChart3, 
  Users, 
  Star, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

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

interface SkillStats {
  skill: Skill;
  engagement: {
    total_downloads: number;
    unique_downloaders: number;
    total_reviews: number;
    average_rating: number;
    rating_distribution: Record<number, number>;
    purpose_breakdown: Record<string, number>;
  };
  approval: {
    status: string;
    approved_by: string | null;
    approved_at: string | null;
  };
  recent_downloads: Array<{
    user_email: string;
    purpose: string;
    downloaded_at: string;
  }>;
  recent_reviews: Array<{
    user_email: string;
    rating: number;
    feedback: string;
    created_at: string;
  }>;
  stats: {
    engagement_score: string;
    completion_ratio: string;
  };
}

export default function SkillAnalytics() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<SkillStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const result = await authApi.getCurrentUser();
      if (!result.success || result.data.role?.toUpperCase() !== 'ADMIN') {
        router.push('/login');
        return;
      }
      setUser(result.data);
      fetchSkills();
    } catch (err) {
      console.error('Failed to verify admin access:', err);
      router.push('/login');
    }
  };

  const fetchSkills = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter }),
      });

      const response = await fetch(`/api/skills/browse?${params}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setSkills(data.data?.skills || []);
        setCategories(data.data?.filters_available?.categories || []);
      }
    } catch (err) {
      console.error('Error fetching skills:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSkillStats = async (skillId: string) => {
    try {
      const response = await fetch(`/api/skills/${skillId}/stats`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setSelectedSkill(data.data);
      }
    } catch (err) {
      console.error('Error fetching skill stats:', err);
    }
  };

  // --- NEW: Status Management Function ---
  const updateSkillStatus = async (skillId: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to set this skill to ${newStatus}?`)) return;

    try {
      const res = await fetch(`/api/skills/${skillId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await fetchSkillStats(skillId); // Refresh details
        await fetchSkills(); // Refresh list
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  if (!user) return <div className="p-4">Verifying Admin Access...</div>;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Left Panel - Skills List */}
      <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-white flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 space-y-3 z-10">
          <h2 className="font-bold text-lg">📊 Skills Analytics</h2>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={fetchSkills}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 space-y-2 p-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : skills.map(skill => (
            <div
              key={skill.skill_id}
              onClick={() => fetchSkillStats(skill.skill_id)}
              className={`p-3 rounded-lg cursor-pointer border transition-all ${
                selectedSkill?.skill.skill_id === skill.skill_id
                  ? 'bg-blue-50 border-blue-400 shadow-sm'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="font-semibold text-sm">{skill.name}</div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                  skill.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {skill.status}
                </span>
              </div>
              <div className="flex gap-2 mt-2 text-[10px]">
                <span className="bg-gray-200 px-2 py-0.5 rounded">{skill.category}</span>
                <span className="bg-gray-200 px-2 py-0.5 rounded">{skill.difficulty_level}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t bg-white flex justify-between items-center">
          <button onClick={() => { setPage(p => Math.max(1, p - 1)); fetchSkills(); }} disabled={page === 1} className="text-xs px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <span className="text-xs font-medium">Page {page}</span>
          <button onClick={() => { setPage(p => p + 1); fetchSkills(); }} className="text-xs px-3 py-1 border rounded">Next</button>
        </div>
      </div>

      {/* Right Panel - Skill Details */}
      {selectedSkill ? (
        <div className="w-2/3 overflow-y-auto bg-white p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">{selectedSkill.skill.name}</h1>
              <div className="flex items-center gap-3 mt-3 text-gray-500">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">{selectedSkill.skill.category}</span>
                <span>•</span>
                <span className="capitalize">{selectedSkill.skill.difficulty_level} Level</span>
              </div>
            </div>
            <button onClick={() => setSelectedSkill(null)} className="p-2 hover:bg-gray-100 rounded-full transition">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-4 gap-6 mb-10">
            <MetricCard title="Total Downloads" value={selectedSkill.engagement.total_downloads} subtext={`${selectedSkill.engagement.unique_downloaders} unique users`} icon={<Users className="w-4 h-4" />} color="blue" />
            <MetricCard title="Average Rating" value={selectedSkill.engagement.average_rating.toFixed(2)} subtext={`${selectedSkill.engagement.total_reviews} reviews`} icon={<Star className="w-4 h-4" />} color="yellow" />
            <MetricCard title="Engagement" value={selectedSkill.stats.engagement_score} subtext={`Ratio: ${selectedSkill.stats.completion_ratio}%`} icon={<TrendingUp className="w-4 h-4" />} color="purple" />
            
            {/* Status Card with Actions */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              selectedSkill.skill.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
            }`}>
              <div>
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-2">
                  <BarChart3 className="w-3 h-3" /> Status
                </div>
                <div className="text-xl font-black capitalize">{selectedSkill.skill.status}</div>
              </div>
              
              <div className="flex flex-col gap-2 mt-4">
                {selectedSkill.skill.status !== 'approved' && (
                  <button 
                    onClick={() => updateSkillStatus(selectedSkill.skill.skill_id, 'approved')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-[10px] py-2 rounded-md font-bold transition flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" /> APPROVE
                  </button>
                )}
                {selectedSkill.skill.status !== 'rejected' && (
                  <button 
                    onClick={() => updateSkillStatus(selectedSkill.skill.skill_id, 'rejected')}
                    className="w-full bg-white hover:bg-red-50 text-red-600 text-[10px] py-2 rounded-md font-bold border border-red-200 transition flex items-center justify-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" /> REJECT
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="mb-10 p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-lg mb-6">Rating Breakdown</h3>
            <div className="space-y-4">
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="flex items-center gap-4">
                  <div className="w-12 text-sm font-bold text-gray-500">⭐ {rating}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-yellow-400 h-full transition-all duration-500" 
                      style={{ width: `${selectedSkill.engagement.total_reviews > 0 ? (selectedSkill.engagement.rating_distribution[rating] / selectedSkill.engagement.total_reviews) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="w-12 text-right text-xs font-bold text-gray-400">
                    {selectedSkill.engagement.rating_distribution[rating] || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Recent Downloads */}
            <div>
              <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {selectedSkill.recent_downloads.slice(0, 5).map((download, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-xl text-sm border border-gray-100">
                    <div className="font-bold text-blue-600">{download.user_email}</div>
                    <div className="text-gray-500 text-xs mt-1 italic">"{download.purpose || 'General Use'}"</div>
                    <div className="text-[10px] text-gray-400 mt-2 uppercase font-semibold">
                      {new Date(download.downloaded_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Reviews */}
            <div>
              <h3 className="font-bold text-lg mb-4">User Feedback</h3>
              <div className="space-y-3">
                {selectedSkill.recent_reviews.length > 0 ? selectedSkill.recent_reviews.slice(0, 3).map((review, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-xl text-sm border-2 border-yellow-100 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-bold">{review.user_email}</div>
                      <div className="text-yellow-500">{'★'.repeat(review.rating)}</div>
                    </div>
                    <p className="text-gray-600 leading-relaxed">"{review.feedback}"</p>
                  </div>
                )) : <div className="text-gray-400 text-sm italic">No reviews yet</div>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-2/3 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="bg-white p-6 rounded-full shadow-xl mb-6 inline-block">
              <BarChart3 className="w-12 h-12 text-blue-500 opacity-80" />
            </div>
            <h3 className="text-xl font-bold text-gray-400">Select a skill to view analytics</h3>
            <p className="text-gray-400 text-sm mt-2">Historical data, user feedback, and status management</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Metric Card Component
function MetricCard({ title, value, subtext, icon, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  };

  return (
    <div className={`p-5 rounded-2xl border ${colors[color] || colors.blue}`}>
      <div className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest opacity-70 mb-3">
        {icon} {title}
      </div>
      <div className="text-3xl font-black">{value}</div>
      <div className="text-xs mt-2 font-medium opacity-60">{subtext}</div>
    </div>
  );
}