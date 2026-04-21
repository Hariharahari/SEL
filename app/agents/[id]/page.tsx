import { SELAgentCard } from '@/types';
import DownloadModal from '@/components/DownloadModal';
import FeedbackForm from '@/components/FeedbackForm';
import Link from 'next/link';
import { ArrowLeft, Code2, Zap, Shield, BookOpen, Users, CheckCircle, Grid3X3, Download } from 'lucide-react';
import { getCategoryForSpecialization } from '@/lib/categoryMapping';

interface AgentDetailPageProps {
  params: Promise<{ id: string }>;
}

async function AgentDetailServer({ id }: { id: string }) {
  const { getAgentById } = await import('@/lib/agentStore');
  const agent = await getAgentById(id);
  return agent;
}

export default async function AgentDetailPage({
  params,
}: AgentDetailPageProps) {
  const { id: agentId } = await params;

  let agent: SELAgentCard | null = null;
  let error: string | null = null;

  if (!agentId) {
    error = 'No agent ID provided';
  } else {
    try {
      agent = await AgentDetailServer({ id: agentId });
      if (!agent) {
        error = 'Agent not found';
      }
    } catch (err) {
      console.error('Error loading agent:', err);
      error = 'Failed to load agent';
    }
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-white px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/agents"
            className="
              inline-flex items-center gap-2 text-blue-600 hover:text-blue-700
              font-medium mb-6 transition-colors duration-200
            "
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </Link>

          <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
            {error || 'Agent not found'}
          </div>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    stable: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    beta: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    rc: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    alpha: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    deprecated: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  };

  const statusColor =
    statusColors[agent.status] || statusColors.stable;

  const { category, subcategory } = getCategoryForSpecialization(
    agent.specialization.primary
  );

  const categoryColors: Record<string, string> = {
    'Frontend': 'bg-blue-100 text-blue-700',
    'Backend': 'bg-purple-100 text-purple-700',
    'Testing': 'bg-green-100 text-green-700',
    'DevOps': 'bg-orange-100 text-orange-700',
    'Database': 'bg-indigo-100 text-indigo-700',
    'Security': 'bg-red-100 text-red-700',
    'Code Quality': 'bg-cyan-100 text-cyan-700',
    'Monitoring': 'bg-yellow-100 text-yellow-700',
    'Documentation': 'bg-pink-100 text-pink-700',
    'Product': 'bg-teal-100 text-teal-700',
  };

  const categoryColor = categoryColors[category] || 'bg-gray-100 text-gray-700';

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-gray-900 text-white py-16 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <Link
            href="/agents"
            className="
              inline-flex items-center gap-2 text-blue-100 hover:text-white
              font-medium mb-6 transition-colors duration-200
            "
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryColor}`}>
                  {category}
                </span>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                  {agent.status}
                </div>
              </div>
              <h1 className="text-5xl font-bold mb-4 leading-tight">
                {agent.name}
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed max-w-2xl">
                {agent.description}
              </p>
              {subcategory && (
                <p className="text-blue-200 mt-3 font-medium">
                  {subcategory}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <DownloadModal agent={agent} />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-gray-50 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <p className="text-sm text-gray-600 font-medium mb-1">Version</p>
              <p className="text-2xl font-bold text-gray-900">{agent.version}</p>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <p className="text-sm text-gray-600 font-medium mb-1">Organization</p>
              <p className="text-lg font-bold text-gray-900 truncate">{agent.origin.org}</p>
            </div>
            {agent.rating && (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <p className="text-sm text-gray-600 font-medium mb-1">Rating</p>
                <p className="text-2xl font-bold text-gray-900">{agent.rating.grade}</p>
              </div>
            )}
            {agent.stars !== undefined && (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <p className="text-sm text-gray-600 font-medium mb-1">Stars</p>
                <p className="text-2xl font-bold text-gray-900">⭐ {agent.stars}</p>
              </div>
            )}
          </div>

          {/* Origin & Maintainers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <Grid3X3 className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Organization</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Organization</p>
                  <p className="text-lg text-gray-900 font-semibold">{agent.origin.org}</p>
                </div>
                {agent.origin.sub_org && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Division</p>
                    <p className="text-lg text-gray-900">{agent.origin.sub_org}</p>
                  </div>
                )}
                {agent.origin.creator && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Creator</p>
                    <p className="text-lg text-gray-900">{agent.origin.creator}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Maintainers</h2>
              </div>
              <div className="space-y-4">
                {agent.maintainers.map((maintainer, idx) => (
                  <div key={idx} className="pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                    <p className="text-lg font-semibold text-gray-900">{maintainer.name}</p>
                    <p className="text-sm text-gray-600 break-all">{maintainer.contact}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Technology & Specialization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <Code2 className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Technologies</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {agent.technology.map((tech) => (
                  <span
                    key={tech}
                    className="
                      px-3 py-1 bg-green-100 text-green-800
                      rounded-full text-sm font-medium
                    "
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-5 h-5 text-orange-600" />
                <h2 className="text-xl font-semibold text-gray-900">Specialization</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Primary Domain</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {agent.specialization.primary.replace(/_/g, ' ')}
                  </p>
                </div>
                {agent.specialization['domain specific'] &&
                  agent.specialization['domain specific'].length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium mb-2">Domain Specific</p>
                      <div className="flex flex-wrap gap-2">
                        {agent.specialization['domain specific'].map((domain, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium"
                          >
                            {domain.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Tasks */}
          {agent.tasks.length > 0 && (
            <div className="bg-white rounded-lg p-8 border border-gray-200 mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-5 h-5 text-yellow-600" />
                <h2 className="text-2xl font-semibold text-gray-900">Supported Tasks</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agent.tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="p-6 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-semibold text-gray-900 text-lg">{task.name}</h3>
                      <span
                        className={`
                          px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap
                          ${
                            task.async
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                          }
                        `}
                      >
                        {task.async ? 'Async' : 'Sync'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{task.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documentation */}
          <div className="bg-white rounded-lg p-8 border border-gray-200 mb-12">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-5 h-5 text-pink-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Documentation</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg border border-pink-200">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">README</h3>
                <p className="text-sm text-gray-700 line-clamp-4 leading-relaxed">
                  {agent.documentation.readme}
                </p>
              </div>
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">How-To Guide</h3>
                <p className="text-sm text-gray-700 line-clamp-4 leading-relaxed">
                  {agent.documentation.howto}
                </p>
              </div>
              {agent.documentation.changelog && (
                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg">Changelog</h3>
                  <p className="text-sm text-gray-700 line-clamp-4 leading-relaxed">
                    {agent.documentation.changelog}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Supported Harness */}
          <div className="bg-white rounded-lg p-8 border border-gray-200 mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Supported Harnesses
            </h2>
            <div className="flex flex-wrap gap-3">
              {agent['supported harness'].map((harness) => (
                <div
                  key={harness}
                  className="
                    px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100
                    border border-blue-200 rounded-lg
                    text-gray-800 font-medium
                  "
                >
                  {harness}
                </div>
              ))}
            </div>
          </div>

          {/* Downloads & Rating */}
          {agent.downloads && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 border border-gray-200 mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Download className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Download Statistics
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Last Downloaded</p>
                  <p className="text-lg font-bold text-gray-900">{agent.downloads.last_downloaded}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Last 7 Days</p>
                  <p className="text-lg font-bold text-gray-900">{agent.downloads.total_download_7_days}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Last 30 Days</p>
                  <p className="text-lg font-bold text-gray-900">{agent.downloads.total_download_30_days}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Total Downloads</p>
                  <p className="text-lg font-bold text-gray-900">{agent.downloads.total_download_overall.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Feedback Section */}
      <section className="bg-gray-50 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <FeedbackForm agentId={agent['agent id']} agentName={agent.name} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Use This Agent?</h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Download the YAML configuration and integrate this agent into your workflow today.
          </p>
          <div className="flex gap-4 justify-center">
            <DownloadModal agent={agent} />
            <Link
              href="/agents"
              className="
                inline-flex items-center gap-2 px-8 py-4 rounded-lg
                bg-white/20 hover:bg-white/30 text-white font-bold
                border border-white/30
                transition-all duration-200
              "
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Directory
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
