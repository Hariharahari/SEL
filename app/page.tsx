import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Code2,
  Download,
  Gauge,
  Search,
  Shield,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react';
import AgentCard from '@/components/AgentCard';
import { getTrendingAgents } from '@/lib/agentWorkflow';
import type { SELAgentCard } from '@/types';

async function getFeaturedAgents(): Promise<SELAgentCard[]> {
  try {
    return await getTrendingAgents(6);
  } catch (error) {
    console.error('Error loading featured agents:', error);
    return [];
  }
}

const valueProps = [
  {
    title: 'Discover trusted skills',
    description: 'Browse enterprise-ready skills with clear ownership, versioning, and searchable descriptions.',
    icon: Search,
  },
  {
    title: 'Review before adoption',
    description: 'Track usage, feedback, and approval status before a skill becomes part of your standard toolkit.',
    icon: Shield,
  },
  {
    title: 'Scale reusable skills',
    description: 'Package repeatable expertise into skills teams can share across engineering workflows.',
    icon: Sparkles,
  },
];

const workflowSteps = [
  {
    title: 'Find the right skill',
    description: 'Use the directory to compare capabilities, specialization, and documentation before downloading.',
    icon: Search,
  },
  {
    title: 'Download with context',
    description: 'Authenticated downloads capture usage purpose so teams can understand adoption over time.',
    icon: Download,
  },
  {
    title: 'Review outcomes',
    description: 'Feedback and analytics help maintainers improve quality and guide future approvals.',
    icon: CheckCircle2,
  },
];

const stats = [
  { label: 'Directory entries', value: '2000+' },
  { label: 'Enterprise-ready review flow', value: '100%' },
  { label: 'Always-on availability', value: '24/7' },
];

export default async function HomePage() {
  const trendingAgents = await getFeaturedAgents();

  return (
    <div className="sel-page">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f1c4f] via-[#1e3a8a] to-[#101827] px-4 py-24 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,198,255,0.38),transparent_45%)]" />
        </div>
        <div className="sel-shell relative z-10">
          <div className="grid gap-10 lg:grid-cols-[1.35fr_0.85fr] lg:items-end">
            <div className="max-w-3xl">
              <span className="sel-badge bg-white/10 text-white">SEL Ignite</span>
              <h1 className="mt-6 text-5xl font-semibold leading-tight md:text-6xl">
                Discover and govern AI skills with a directory built for teams.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82">
                Search approved skills, track adoption, collect feedback, and keep uploads moving through a review workflow that fits enterprise engineering.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/agents" className="sel-button-primary px-6 py-3 text-base">
                  Open Directory
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/upload" className="sel-button-outline border-white/25 px-6 py-3 text-base text-white hover:bg-white/10">
                  Submit a Skill
                  <Upload className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
                  <p className="text-sm text-white/70">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sel-section">
        <div className="sel-shell">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-3xl font-semibold text-text-primary">Why teams use SEL Ignite</h2>
            <p className="mt-3 text-base leading-7 text-text-secondary">
              The portal is shaped around adoption, review, and operational clarity rather than a generic gallery of cards.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {valueProps.map(({ title, description, icon: Icon }) => (
              <div key={title} className="sel-panel p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-text-primary">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-text-secondary">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sel-section bg-bg-secondary">
        <div className="sel-shell">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <div className="sel-panel p-6">
              <h2 className="text-3xl font-semibold text-text-primary">How the workflow fits together</h2>
              <p className="mt-3 text-base leading-7 text-text-secondary">
                Skills move from upload to approval to adoption, and every step carries the metadata needed for search, download analytics, and feedback review.
              </p>
              <div className="mt-6 space-y-4">
                {workflowSteps.map(({ title, description, icon: Icon }) => (
                  <div key={title} className="rounded-2xl border border-border bg-bg-primary p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
                        <p className="mt-1 text-sm leading-6 text-text-secondary">{description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: 'Semantic search', description: 'Find skills by description and intent, not just exact names.', icon: Brain },
                { title: 'Download intelligence', description: 'Measure last 7, 30, and 365 day adoption for each approved skill.', icon: Gauge },
                { title: 'Feedback loops', description: 'Collect ratings and comments that maintainers can act on quickly.', icon: BookOpen },
                { title: 'Shared ownership', description: 'Support teams, maintainers, and approvers in one place.', icon: Users },
              ].map(({ title, description, icon: Icon }) => (
                <div key={title} className="sel-panel p-6">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-4 text-lg font-semibold text-text-primary">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sel-section">
        <div className="sel-shell">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold text-text-primary">Trending skills</h2>
              <p className="mt-3 text-base leading-7 text-text-secondary">
                These skills are ranked by real download activity, with a trend signal based on recent weekly momentum.
              </p>
            </div>
            <Link href="/agents" className="sel-button-ghost border border-border px-4 py-2 text-sm">
              View full directory
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {trendingAgents.length === 0 ? (
            <div className="sel-panel p-8 text-center">
              <Code2 className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-4 text-lg font-semibold text-text-primary">No skills available yet.</p>
              <p className="mt-2 text-sm text-text-secondary">
                Submit the first approved skill to start building the directory.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {trendingAgents.map((agent) => (
                <AgentCard key={agent['agent id']} agent={agent} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="sel-section bg-bg-secondary">
        <div className="sel-shell">
          <div className="sel-panel px-6 py-8 md:px-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold text-text-primary">Ready to work with the directory?</h2>
                <p className="mt-3 text-base leading-7 text-text-secondary">
                  Explore approved skills, or submit a new one for admin review and analytics-backed rollout.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/agents" className="sel-button-primary px-5 py-3 text-sm">
                  Browse skills
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/upload" className="sel-button-ghost border border-border px-5 py-3 text-sm">
                  Upload a skill
                  <Upload className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
