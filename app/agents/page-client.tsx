'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Filter, Search, Sparkles } from 'lucide-react';
import AgentCard from '@/components/AgentCard';
import { SELAgentCard } from '@/types';
import {
  CATEGORIES,
  SUBCATEGORIES_BY_CATEGORY,
} from '@/lib/categoryMapping';
import { getAgentCategory } from '@/lib/agentCategory';

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

interface EnhancedAgent extends SELAgentCard {
  mappedCategory: string;
  mappedSubcategory: string;
}

export default function AgentsDirectoryClient({
  initialAgents,
  initialError,
}: AgentsDirectoryClientProps) {
  const [agents] = useState(initialAgents);
  const [semanticAgents, setSemanticAgents] = useState<SELAgentCard[] | null>(null);
  const [filteredAgents, setFilteredAgents] = useState<EnhancedAgent[]>([]);
  const [error] = useState(initialError);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSemanticSearching, setIsSemanticSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    technology: '',
    category: '',
    subcategory: '',
  });

  const sourceAgents = semanticAgents || agents;

  const agentsWithCategories: EnhancedAgent[] = useMemo(
    () =>
      sourceAgents.map((agent) => {
        const { category, subcategory } = getAgentCategory(agent);
        return {
          ...agent,
          mappedCategory: category,
          mappedSubcategory: subcategory,
        };
      }),
    [sourceAgents]
  );

  const uniqueStatuses = useMemo(
    () => Array.from(new Set(agents.map((agent) => agent.status))).sort(),
    [agents]
  );
  const uniqueTechnologies = useMemo(
    () => Array.from(new Set(agents.flatMap((agent) => agent.technology))).sort(),
    [agents]
  );
  const availableSubcategories = filters.category
    ? SUBCATEGORIES_BY_CATEGORY[filters.category] || []
    : [];

  useEffect(() => {
    let result = agentsWithCategories;

    if (filters.search && !semanticAgents) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchLower) ||
          agent.description.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status) {
      result = result.filter((agent) => agent.status === filters.status);
    }

    if (filters.technology) {
      result = result.filter((agent) => agent.technology.includes(filters.technology));
    }

    if (filters.category) {
      result = result.filter((agent) => agent.mappedCategory === filters.category);
    }

    if (filters.subcategory) {
      result = result.filter((agent) => agent.mappedSubcategory === filters.subcategory);
    }

    setFilteredAgents(result);
    setCurrentPage(1);
  }, [filters, semanticAgents, agentsWithCategories]);

  useEffect(() => {
    let active = true;

    const runSemanticSearch = async () => {
      const query = filters.search.trim();

      if (!query) {
        setSemanticAgents(null);
        setSearchError(null);
        return;
      }

      setIsSemanticSearching(true);

      try {
        const response = await fetch('/api/ai-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Semantic search failed');
        }

        const payload = await response.json();
        if (!active) return;

        const results = Array.isArray(payload.results)
          ? payload.results.map((item: { agent: SELAgentCard }) => item.agent)
          : [];

        setSemanticAgents(results);
        setSearchError(null);
      } catch (semanticError) {
        if (!active) return;
        setSemanticAgents(null);
        setSearchError(
          semanticError instanceof Error ? semanticError.message : 'Semantic search failed'
        );
      } finally {
        if (active) {
          setIsSemanticSearching(false);
        }
      }
    };

    const timeout = window.setTimeout(runSemanticSearch, 320);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [filters.search]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    if (key === 'category') {
      setFilters((current) => ({ ...current, category: value, subcategory: '' }));
      return;
    }

    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      technology: '',
      category: '',
      subcategory: '',
    });
  };

  return (
    <div className="sel-page">
      <section className="border-b border-border bg-bg-secondary px-4 py-14">
        <div className="relative z-10 mx-auto max-w-7xl">
          <h1 className="mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-3xl font-bold leading-tight text-transparent md:text-4xl">
            Skill Directory
          </h1>
          <p className="max-w-2xl text-base text-text-secondary md:text-lg">
            Explore {agents.length}+ specialized AI skills across Frontend, Backend, Testing, DevOps, and more.
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-bg-primary px-4 py-8">
        <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-center gap-3">
              <Filter className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-text-primary">Filter Skills</h2>
            </div>

          <div className="sel-panel p-6">
            {searchError && (
              <div className="mb-4 rounded-xl border border-warning/20 bg-warning/10 p-3 text-sm text-text-primary">
                {searchError}
              </div>
            )}

            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="sel-label">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search skills by name, description, tags, or categories..."
                    value={filters.search}
                    onChange={(event) => handleFilterChange('search', event.target.value)}
                    className="sel-input py-2 pl-4 pr-10"
                  />
                  <Search className="absolute right-3 top-2.5 h-5 w-5 text-text-muted" />
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {isSemanticSearching
                    ? 'Searching Redis-backed vectors now...'
                    : 'Search uses approved skill descriptions plus FAISS similarity.'}
                </div>
              </div>

              <div>
                <label className="sel-label">Category</label>
                <select
                  value={filters.category}
                  onChange={(event) => handleFilterChange('category', event.target.value)}
                  className="sel-input px-4 py-2"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="sel-label">Subcategory</label>
                <select
                  value={filters.subcategory}
                  onChange={(event) => handleFilterChange('subcategory', event.target.value)}
                  disabled={!filters.category}
                  className="sel-input px-4 py-2"
                >
                  <option value="">All Subcategories</option>
                  {availableSubcategories.map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="sel-label">Status</label>
                <select
                  value={filters.status}
                  onChange={(event) => handleFilterChange('status', event.target.value)}
                  className="sel-input px-4 py-2"
                >
                  <option value="">All Statuses</option>
                  {uniqueStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="sel-label">Technology</label>
                <select
                  value={filters.technology}
                  onChange={(event) => handleFilterChange('technology', event.target.value)}
                  className="sel-input px-4 py-2"
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

            {(filters.search ||
              filters.status ||
              filters.technology ||
              filters.category ||
              filters.subcategory) && (
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-primary transition-colors duration-200 hover:text-primary-dark"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="bg-bg-primary px-4 py-12">
        <div className="mx-auto max-w-7xl">
          {error ? (
            <div className="rounded-xl border border-error/20 bg-error/10 p-4 text-error">
              {error}
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="py-12 text-center">
              <p className="mb-4 text-lg text-text-secondary">
                {agents.length === 0
                  ? 'No agents found. Start by uploading your first agent.'
                  : 'No skills found matching your filters.'}
              </p>
              {agents.length > 0 && filters.search && (
                <button onClick={clearFilters} className="sel-button-primary px-6 py-2">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">Search Results</h2>
                  <p className="mt-1 text-text-secondary">
                    Showing {Math.min((currentPage - 1) * AGENTS_PER_PAGE + 1, filteredAgents.length)} -{' '}
                    {Math.min(currentPage * AGENTS_PER_PAGE, filteredAgents.length)} of {filteredAgents.length} skills
                    {filters.search && semanticAgents ? ' from semantic search' : ''}
                  </p>
                </div>
              </div>

              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAgents
                  .slice((currentPage - 1) * AGENTS_PER_PAGE, currentPage * AGENTS_PER_PAGE)
                  .map((agent) => (
                    <AgentCard
                      key={agent['agent id']}
                      agent={agent}
                      category={agent.mappedCategory}
                      subcategory={agent.mappedSubcategory}
                    />
                  ))}
              </div>

              {Math.ceil(filteredAgents.length / AGENTS_PER_PAGE) > 1 && (
                <div className="mt-12 flex items-center justify-center gap-4 border-t border-border pt-8">
                  <button
                    onClick={() => setCurrentPage((value) => Math.max(value - 1, 1))}
                    disabled={currentPage === 1}
                    className="sel-button-ghost border border-border px-4 py-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from(
                      { length: Math.ceil(filteredAgents.length / AGENTS_PER_PAGE) },
                      (_, index) => index + 1
                    )
                      .slice(
                        Math.max(0, currentPage - 2),
                        Math.min(Math.ceil(filteredAgents.length / AGENTS_PER_PAGE), currentPage + 2)
                      )
                      .map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`rounded-lg px-3 py-2 font-medium transition-colors duration-200 ${
                            currentPage === page
                              ? 'bg-primary text-white'
                              : 'bg-bg-tertiary text-text-primary hover:bg-primary/10'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((value) =>
                        Math.min(value + 1, Math.ceil(filteredAgents.length / AGENTS_PER_PAGE))
                      )
                    }
                    disabled={currentPage === Math.ceil(filteredAgents.length / AGENTS_PER_PAGE)}
                    className="sel-button-ghost border border-border px-4 py-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
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
