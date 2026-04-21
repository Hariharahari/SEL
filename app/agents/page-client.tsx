'use client';

import { useState, useEffect } from 'react';
import AgentCard from '@/components/AgentCard';
import { SELAgentCard } from '@/types';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIES, SUBCATEGORIES_BY_CATEGORY, getCategoryForSpecialization } from '@/lib/categoryMapping';

const AGENTS_PER_PAGE = 12;

interface FilterState {
  search: string;
  status: string;
  technology: string;
  category: string;
  subcategory: string;
}

interface AgentsDirectoryClientProps {
  initialAgents: SELAgentCard[];
  initialError: string | null;
}

export default function AgentsDirectoryClient({
  initialAgents,
  initialError,
}: AgentsDirectoryClientProps) {
  const [agents] = useState(initialAgents);
  const [filteredAgents, setFilteredAgents] = useState<any[]>(
    initialAgents
  );
  const [error] = useState(initialError);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    technology: '',
    category: '',
    subcategory: '',
  });

  // Enhance agents with mapped categories
  interface EnhancedAgent extends SELAgentCard {
    mappedCategory: string;
    mappedSubcategory: string;
  }

  const agentsWithCategories: EnhancedAgent[] = agents.map((agent) => {
    const { category, subcategory } = getCategoryForSpecialization(
      agent.specialization.primary
    );
    return { ...agent, mappedCategory: category, mappedSubcategory: subcategory };
  });

  const uniqueStatuses = Array.from(
    new Set(agents.map((a) => a.status))
  ).sort();

  const uniqueTechnologies = Array.from(
    new Set(agents.flatMap((a) => a.technology))
  ).sort();

  const availableSubcategories = filters.category
    ? SUBCATEGORIES_BY_CATEGORY[filters.category] || []
    : [];

  // Apply filters whenever filter state changes
  useEffect(() => {
    let result = agentsWithCategories;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchLower) ||
          agent.description.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status) {
      result = result.filter((agent) => agent.status === filters.status);
    }

    // Technology filter
    if (filters.technology) {
      result = result.filter((agent) =>
        agent.technology.includes(filters.technology)
      );
    }

    // Category filter
    if (filters.category) {
      result = result.filter((agent) => agent.mappedCategory === filters.category);
    }

    // Subcategory filter
    if (filters.subcategory) {
      result = result.filter(
        (agent) => agent.mappedSubcategory === filters.subcategory
      );
    }

    setFilteredAgents(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters, agents]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    if (key === 'category') {
      // Reset subcategory when category changes
      setFilters((prev) => ({ ...prev, [key]: value, subcategory: '' }));
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-gray-900 text-white py-20 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Agent Directory
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Explore {agents.length}+ specialized AI agents across Frontend, Backend, Testing, DevOps, and more.
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-gray-50 py-12 px-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Filter className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filter Agents</h2>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search agents..."
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange('search', e.target.value)
                    }
                    className="
                      w-full px-4 py-2 border border-gray-300 rounded-lg
                      focus:ring-2 focus:ring-blue-600 focus:border-transparent
                      outline-none transition-all duration-200
                    "
                  />
                  <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="
                    w-full px-4 py-2 border border-gray-300 rounded-lg
                    focus:ring-2 focus:ring-blue-600 focus:border-transparent
                    outline-none transition-all duration-200
                  "
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategory Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory
                </label>
                <select
                  value={filters.subcategory}
                  onChange={(e) => handleFilterChange('subcategory', e.target.value)}
                  disabled={!filters.category}
                  className="
                    w-full px-4 py-2 border border-gray-300 rounded-lg
                    focus:ring-2 focus:ring-blue-600 focus:border-transparent
                    outline-none transition-all duration-200
                    disabled:bg-gray-100 disabled:text-gray-500
                  "
                >
                  <option value="">All Subcategories</option>
                  {availableSubcategories.map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="
                    w-full px-4 py-2 border border-gray-300 rounded-lg
                    focus:ring-2 focus:ring-blue-600 focus:border-transparent
                    outline-none transition-all duration-200
                  "
                >
                  <option value="">All Statuses</option>
                  {uniqueStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Technology Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technology
                </label>
                <select
                  value={filters.technology}
                  onChange={(e) => handleFilterChange('technology', e.target.value)}
                  className="
                    w-full px-4 py-2 border border-gray-300 rounded-lg
                    focus:ring-2 focus:ring-blue-600 focus:border-transparent
                    outline-none transition-all duration-200
                  "
                >
                  <option value="">All Technologies</option>
                  {uniqueTechnologies.map((tech) => (
                    <option key={tech} value={tech}>
                      {tech}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {(filters.search || filters.status || filters.technology || filters.category || filters.subcategory) && (
              <button
                onClick={() =>
                  setFilters({ search: '', status: '', technology: '', category: '', subcategory: '' })
                }
                className="
                  text-sm text-blue-600 hover:text-blue-700
                  font-medium transition-colors duration-200
                "
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="bg-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600 mb-4">
                {agents.length === 0
                  ? 'No agents found. Start by uploading your first agent!'
                  : 'No agents found matching your filters.'}
              </p>
              {agents.length > 0 && filters.search && (
                <button
                  onClick={() =>
                    setFilters({ search: '', status: '', technology: '', category: '', subcategory: '' })
                  }
                  className="
                    inline-flex items-center gap-2 px-6 py-2 rounded-lg
                    bg-blue-600 hover:bg-blue-700 text-white font-medium
                    transition-colors duration-200
                  "
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Search Results
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Showing {Math.min((currentPage - 1) * AGENTS_PER_PAGE + 1, filteredAgents.length)} - {Math.min(currentPage * AGENTS_PER_PAGE, filteredAgents.length)} of {filteredAgents.length} agents
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredAgents
                  .slice(
                    (currentPage - 1) * AGENTS_PER_PAGE,
                    currentPage * AGENTS_PER_PAGE
                  )
                  .map((agent) => (
                  <AgentCard 
                    key={agent['agent id']} 
                    agent={agent}
                    category={agent.mappedCategory}
                    subcategory={agent.mappedSubcategory}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {Math.ceil(filteredAgents.length / AGENTS_PER_PAGE) > 1 && (
                <div className="flex items-center justify-center gap-4 mt-12 pt-8 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="
                      flex items-center gap-2 px-4 py-2 rounded-lg
                      bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium
                      transition-colors duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from(
                      { length: Math.ceil(filteredAgents.length / AGENTS_PER_PAGE) },
                      (_, i) => i + 1
                    )
                      .slice(
                        Math.max(0, currentPage - 2),
                        Math.min(Math.ceil(filteredAgents.length / AGENTS_PER_PAGE), currentPage + 2)
                      )
                      .map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`
                            px-3 py-2 rounded-lg font-medium transition-colors duration-200
                            ${currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }
                          `}
                        >
                          {page}
                        </button>
                      ))}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage(prev =>
                        Math.min(
                          prev + 1,
                          Math.ceil(filteredAgents.length / AGENTS_PER_PAGE)
                        )
                      )
                    }
                    disabled={currentPage === Math.ceil(filteredAgents.length / AGENTS_PER_PAGE)}
                    className="
                      flex items-center gap-2 px-4 py-2 rounded-lg
                      bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium
                      transition-colors duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
