import { SELAgentCard } from '@/types';
import DownloadButton from '@/components/DownloadButton';
import FeedbackForm from '@/components/FeedbackForm';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Code2, Download, Grid3X3, Shield, Users, Zap } from 'lucide-react';
import { getAgentCategory } from '@/lib/agentCategory';

interface AgentDetailPageProps {
  params: Promise<{ id: string }>;
}

async function AgentDetailServer({ id }: { id: string }) {
  const { getAgentById } = await import('@/lib/agentStore');
  return getAgentById(id);
}

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { id: agentId } = await params;

  let agent: SELAgentCard | null = null;
  let error: string | null = null;

  if (!agentId) {
    error = 'No agent ID provided';
  } else {
    try {
      agent = await AgentDetailServer({ id: agentId });
      if (!agent) error = 'Agent not found';
    } catch (loadError) {
      console.error('Error loading agent:', loadError);
      error = 'Failed to load agent';
    }
  }

  if (error || !agent) {
    return (
      <div className="sel-page px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <Link href="/agents" className="mb-6 inline-flex items-center gap-2 font-medium text-primary transition-colors hover:text-primary-dark">
            <ArrowLeft className="h-4 w-4" />
            Back to Directory
          </Link>
          <div className="rounded-lg border border-error/20 bg-error/10 p-6 font-medium text-error">
            {error || 'Agent not found'}
          </div>
        </div>
      </div>
    );
  }

  const { category, subcategory } = getAgentCategory(agent);

  return (
    <div className="sel-page">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-[#2443b9] to-[#152347] px-4 py-16 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.22),rgba(255,255,255,0))]" />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl">
          <Link href="/agents" className="mb-6 inline-flex items-center gap-2 font-medium text-white/85 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Directory
          </Link>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="sel-badge bg-white/15 text-white">{category}</span>
                <span className="sel-badge bg-white/15 text-white">{agent.status}</span>
                {subcategory && <span className="sel-badge bg-white/10 text-white/85">{subcategory}</span>}
              </div>
              <h1 className="text-5xl font-bold leading-tight">{agent.name}</h1>
              <p className="mt-4 max-w-2xl text-xl leading-relaxed text-white/85">{agent.description}</p>
            </div>
            <div className="flex gap-3">
              <DownloadButton agent={agent} />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-bg-secondary px-4 py-12">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-border bg-bg-primary p-6">
              <p className="mb-1 text-sm font-medium text-text-secondary">Version</p>
              <p className="text-2xl font-bold text-text-primary">{agent.version}</p>
            </div>
            <div className="rounded-lg border border-border bg-bg-primary p-6">
              <p className="mb-1 text-sm font-medium text-text-secondary">BG</p>
              <p className="truncate text-lg font-bold text-text-primary">{agent.origin.org}</p>
            </div>
            {agent.rating && (
              <div className="rounded-lg border border-border bg-bg-primary p-6">
                <p className="mb-1 text-sm font-medium text-text-secondary">Rating</p>
                <p className="text-2xl font-bold text-text-primary">{agent.rating.grade}</p>
              </div>
            )}
            {agent.stars !== undefined && (
              <div className="rounded-lg border border-border bg-bg-primary p-6">
                <p className="mb-1 text-sm font-medium text-text-secondary">Stars</p>
                <p className="text-2xl font-bold text-text-primary">⭐ {agent.stars}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-bg-primary p-8">
              <div className="mb-6 flex items-center gap-3">
                <Grid3X3 className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-text-primary">Organization</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-text-secondary">BG</p>
                  <p className="text-lg font-semibold text-text-primary">{agent.origin.org}</p>
                </div>
                {agent.origin.sub_org && (
                  <div>
                    <p className="text-sm font-medium text-text-secondary">ISU</p>
                    <p className="text-lg text-text-primary">{agent.origin.sub_org}</p>
                  </div>
                )}
                {agent.origin.creator && (
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Account</p>
                    <p className="text-lg text-text-primary">{agent.origin.creator}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-bg-primary p-8">
              <div className="mb-6 flex items-center gap-3">
                <Users className="h-5 w-5 text-secondary" />
                <h2 className="text-xl font-semibold text-text-primary">Creator / Maintainers</h2>
              </div>
              <div className="space-y-4">
                {agent.maintainers.map((maintainer, index) => (
                  <div key={`${maintainer.contact}-${index}`} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                    <p className="text-lg font-semibold text-text-primary">{maintainer.name}</p>
                    <p className="break-all text-sm text-text-secondary">{maintainer.contact}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-bg-primary p-8">
              <div className="mb-6 flex items-center gap-3">
                <Code2 className="h-5 w-5 text-success" />
                <h2 className="text-xl font-semibold text-text-primary">Technologies</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {agent.technology.map((tech) => (
                  <span key={tech} className="rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-bg-primary p-8">
              <div className="mb-6 flex items-center gap-3">
                <Shield className="h-5 w-5 text-warning" />
                <h2 className="text-xl font-semibold text-text-primary">Specialization</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-sm font-medium text-text-secondary">Primary Domain</p>
                  <p className="text-lg font-semibold capitalize text-text-primary">
                    {agent.specialization.primary.replace(/_/g, ' ')}
                  </p>
                </div>
                {agent.specialization['domain specific']?.length ? (
                  <div>
                    <p className="mb-2 text-sm font-medium text-text-secondary">Domain Specific</p>
                    <div className="flex flex-wrap gap-2">
                      {agent.specialization['domain specific'].map((domain) => (
                        <span key={domain} className="rounded bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
                          {domain.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {agent.tasks.length > 0 && (
            <div className="rounded-lg border border-border bg-bg-primary p-8">
              <div className="mb-6 flex items-center gap-3">
                <Zap className="h-5 w-5 text-info" />
                <h2 className="text-2xl font-semibold text-text-primary">Supported Tasks</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {agent.tasks.map((task) => (
                  <div key={task.name} className="rounded-lg border border-border bg-bg-secondary p-6 transition-colors hover:bg-bg-tertiary">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-text-primary">{task.name}</h3>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${task.async ? 'bg-secondary/10 text-secondary' : 'bg-success/10 text-success'}`}>
                        {task.async ? 'Async' : 'Sync'}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">{task.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border bg-bg-primary p-8">
            <div className="mb-6 flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-secondary" />
              <h2 className="text-2xl font-semibold text-text-primary">Documentation</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-bg-secondary p-6">
                <h3 className="mb-3 text-lg font-semibold text-text-primary">README</h3>
                <p className="line-clamp-4 text-sm leading-relaxed text-text-secondary">{agent.documentation.readme}</p>
              </div>
              <div className="rounded-lg border border-border bg-bg-secondary p-6">
                <h3 className="mb-3 text-lg font-semibold text-text-primary">How-To Guide</h3>
                <p className="line-clamp-4 text-sm leading-relaxed text-text-secondary">{agent.documentation.howto}</p>
              </div>
              {agent.documentation.changelog && (
                <div className="rounded-lg border border-border bg-bg-secondary p-6">
                  <h3 className="mb-3 text-lg font-semibold text-text-primary">Changelog</h3>
                  <p className="line-clamp-4 text-sm leading-relaxed text-text-secondary">{agent.documentation.changelog}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-bg-primary p-8">
            <h2 className="mb-6 text-xl font-semibold text-text-primary">Supported Harnesses</h2>
            <div className="flex flex-wrap gap-3">
              {agent['supported harness'].map((harness) => (
                <div key={harness} className="rounded-lg border border-border bg-bg-secondary px-4 py-2 font-medium text-text-primary">
                  {harness}
                </div>
              ))}
            </div>
          </div>

          {agent.downloads && (
            <div className="rounded-lg border border-border bg-gradient-to-r from-primary/10 to-secondary/10 p-8">
              <div className="mb-6 flex items-center gap-3">
                <Download className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-text-primary">Download Statistics</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="mb-1 text-sm font-medium text-text-secondary">Last Downloaded</p>
                  <p className="text-lg font-bold text-text-primary">{agent.downloads.last_downloaded}</p>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-text-secondary">Last 7 Days</p>
                  <p className="text-lg font-bold text-text-primary">{agent.downloads.total_download_7_days}</p>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-text-secondary">Last 30 Days</p>
                  <p className="text-lg font-bold text-text-primary">{agent.downloads.total_download_30_days}</p>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-text-secondary">Total Downloads</p>
                  <p className="text-lg font-bold text-text-primary">{agent.downloads.total_download_overall.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-bg-secondary px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <FeedbackForm agentId={agent['agent id']} agentName={agent.name} />
        </div>
      </section>

      <section className="bg-gradient-to-r from-primary to-secondary px-4 py-16 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Use This Agent?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90">
            Download the package and integrate this agent into your workflow today.
          </p>
          <div className="flex justify-center gap-4">
            <DownloadButton agent={agent} />
            <Link href="/agents" className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/20 px-8 py-4 font-bold text-white transition-all duration-200 hover:bg-white/30">
              <ArrowLeft className="h-5 w-5" />
              Back to Directory
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
