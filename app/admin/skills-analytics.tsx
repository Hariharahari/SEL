"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/auth';
import { ChevronDown, Search, Filter, X, BarChart3, Users, Star, TrendingUp, MessageSquare } from 'lucide-react';

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

      const response = await fetch(`/api/skills/browse?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        console.error(`API error: ${response.status}`, error);
        // If token expired, try to refresh
        if (response.status === 401) {
          // Token refresh will be handled automatically by auth middleware
          return;
        }
        throw new Error('Failed to fetch skills');
      }
      
      const data = await response.json();
      setSkills(data.data?.skills || []);
      setCategories(data.data?.filters_available?.categories || []);
    } catch (err) {
      console.error('Error fetching skills:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSkillStats = async (skillId: string) => {
    try {
      const response = await fetch(`/api/skills/${skillId}/stats`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch skill stats: ${error.error}`);
      }
      
      const data = await response.json();
      setSelectedSkill(data.data);
    } catch (err) {
      console.error('Error fetching skill stats:', err);
    }
  };

  if (!user) return <div className="p-4">Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Skills List */}
      <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-white">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 space-y-3">
          <h2 className="font-bold text-lg">📊 Skills Analytics</h2>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              onBlur={fetchSkills}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              onBlur={fetchSkills}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>

        {/* Skills List */}
        <div className="space-y-2 p-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading skills...</div>
          ) : skills.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No skills found</div>
          ) : (
            skills.map(skill => (
              <div
                key={skill.skill_id}
                onClick={() => fetchSkillStats(skill.skill_id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedSkill?.skill.skill_id === skill.skill_id
                    ? 'bg-blue-50 border border-blue-300'
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <div className="font-semibold text-sm">{skill.name}</div>
                <div className="flex gap-2 mt-2 text-xs text-gray-600">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {skill.category}
                  </span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                    {skill.difficulty_level}
                  </span>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>📊 {skill.total_enrolled} enrolled</span>
                  <span>⭐ {skill.rating}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Skill Details */}
      {selectedSkill ? (
        <div className="w-2/3 overflow-y-auto bg-white p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold">{selectedSkill.skill.name}</h1>
              <p className="text-gray-600 mt-2">{selectedSkill.skill.category} • {selectedSkill.skill.difficulty_level}</p>
            </div>
            <button
              onClick={() => setSelectedSkill(null)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700 font-semibold">
                <Users className="w-4 h-4" />
                Total Downloads
              </div>
              <div className="text-3xl font-bold mt-2">{selectedSkill.engagement.total_downloads}</div>
              <div className="text-sm text-gray-600 mt-1">{selectedSkill.engagement.unique_downloaders} unique users</div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-700 font-semibold">
                <Star className="w-4 h-4" />
                Average Rating
              </div>
              <div className="text-3xl font-bold mt-2">{selectedSkill.engagement.average_rating.toFixed(2)}</div>
              <div className="text-sm text-gray-600 mt-1">{selectedSkill.engagement.total_reviews} reviews</div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 text-purple-700 font-semibold">
                <TrendingUp className="w-4 h-4" />
                Engagement Score
              </div>
              <div className="text-3xl font-bold mt-2">{selectedSkill.stats.engagement_score}</div>
              <div className="text-sm text-gray-600 mt-1">Completion: {selectedSkill.stats.completion_ratio}%</div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700 font-semibold">
                <BarChart3 className="w-4 h-4" />
                Status
              </div>
              <div className="text-lg font-bold mt-2 capitalize">{selectedSkill.skill.status}</div>
              <div className="text-sm text-gray-600 mt-1">{selectedSkill.approval.status}</div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="mb-8">
            <h3 className="font-bold text-lg mb-4">Rating Distribution</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="flex items-center gap-4">
                  <div className="w-12 text-sm font-medium">⭐ {rating}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-yellow-400 h-full"
                      style={{
                        width: `${selectedSkill.engagement.total_reviews > 0
                          ? (selectedSkill.engagement.rating_distribution[rating] / selectedSkill.engagement.total_reviews) * 100
                          : 0}%`,
                      }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm text-gray-600">
                    {selectedSkill.engagement.rating_distribution[rating] || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Downloads */}
          <div className="mb-8">
            <h3 className="font-bold text-lg mb-4">Recent Downloads ({selectedSkill.recent_downloads.length})</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedSkill.recent_downloads.slice(0, 5).map((download, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="font-medium">{download.user_email}</div>
                  <div className="text-gray-600">{download.purpose || 'Not specified'}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(download.downloaded_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Reviews */}
          {selectedSkill.recent_reviews.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-4">Recent Reviews ({selectedSkill.recent_reviews.length})</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {selectedSkill.recent_reviews.slice(0, 5).map((review, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm border-l-4 border-yellow-400">
                    <div className="flex justify-between items-start">
                      <div className="font-medium">{review.user_email}</div>
                      <div className="flex items-center gap-1">
                        {'⭐'.repeat(review.rating)}
                      </div>
                    </div>
                    <p className="text-gray-600 mt-1">{review.feedback}</p>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-2/3 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Select a skill to view detailed analytics</p>
          </div>
        </div>
      )}
    </div>
  );
}
