'use client';

import { SELAgentCard } from '@/types';
import Link from 'next/link';
import { Badge, Code } from 'lucide-react';
import DownloadModal from './DownloadModal';

interface AgentCardProps {
  agent: SELAgentCard;
  category?: string;
  subcategory?: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  stable: { bg: 'bg-green-100', text: 'text-green-800' },
  beta: { bg: 'bg-blue-100', text: 'text-blue-800' },
  rc: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  alpha: { bg: 'bg-orange-100', text: 'text-orange-800' },
  deprecated: { bg: 'bg-red-100', text: 'text-red-800' },
};

export default function AgentCard({ agent, category, subcategory }: AgentCardProps) {
  const statusColor = statusColors[agent.status] || statusColors.stable;

  // Category color mapping
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

  const categoryColor = category ? categoryColors[category] || 'bg-gray-100 text-gray-700' : '';

  return (
    <Link href={`/agents/${agent['agent id']}`}>
      <div
        className="
          h-full p-6 rounded-lg border border-gray-200
          bg-white hover:shadow-lg hover:border-blue-300
          transition-all duration-200 cursor-pointer
        "
      >
        {/* Category & Status Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {category && (
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${categoryColor}`}>
                {category}
              </span>
            )}
          </div>
          <div
            className={`
              px-2 py-1 rounded text-xs font-medium whitespace-nowrap
              ${statusColor.bg} ${statusColor.text}
            `}
          >
            {agent.status}
          </div>
        </div>

        {/* Header */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {agent.name}
          </h3>
          {subcategory && (
            <p className="text-xs text-gray-600 mt-1 font-medium">
              {subcategory}
            </p>
          )}
          <p className="text-sm text-gray-600 mt-2">
            {agent.origin.org}
            {agent.origin.sub_org && ` / ${agent.origin.sub_org}`}
          </p>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 line-clamp-2 mb-4">
          {agent.description}
        </p>

        {/* Version & Rating */}
        <div className="flex items-center gap-4 text-xs text-gray-600 mb-4">
          <span>v{agent.version}</span>
          {agent.rating && (
            <span className="flex items-center gap-1">
              {agent.rating.grade} ({agent.rating['Jast score']?.toFixed(1)})
            </span>
          )}
          {agent.stars !== undefined && (
            <span>⭐ {agent.stars}</span>
          )}
        </div>

        {/* Technology Tags */}
        <div className="flex flex-wrap gap-1">
          {agent.technology.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="
                px-2 py-1 bg-gray-100 text-gray-700
                text-xs rounded font-medium
              "
            >
              {tech}
            </span>
          ))}
          {agent.technology.length > 3 && (
            <span className="px-2 py-1 text-xs text-gray-600">
              +{agent.technology.length - 3} more
            </span>
          )}
        </div>

        {/* Download Count */}
        {agent.downloads && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600">
            <p>
              {agent.downloads.total_download_overall.toLocaleString()} total downloads
            </p>
          </div>
        )}

        {/* Download Buttons - Positioned at bottom */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <DownloadModal agent={agent} />
        </div>
      </div>
    </Link>
  );
}
