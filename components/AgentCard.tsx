'use client';

import Link from 'next/link';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { SELAgentCard } from '@/types';
import DownloadButton from './DownloadButton';
import { calculateTrendDelta, getTrendDirection } from '@/lib/trending';

interface AgentCardProps {
  agent: SELAgentCard;
  category?: string;
  subcategory?: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  stable: { bg: 'bg-success/10', text: 'text-success' },
  beta: { bg: 'bg-info/10', text: 'text-info' },
  rc: { bg: 'bg-warning/10', text: 'text-warning' },
  alpha: { bg: 'bg-warning/10', text: 'text-warning' },
  verified: { bg: 'bg-success/10', text: 'text-success' },
  deprecated: { bg: 'bg-error/10', text: 'text-error' },
};

export default function AgentCard({ agent, category, subcategory }: AgentCardProps) {
  const statusColor = statusColors[agent.status] || statusColors.stable;
  const trendDirection = getTrendDirection(agent);
  const trendDelta = calculateTrendDelta(agent);

  const categoryColors: Record<string, string> = {
    Frontend: 'bg-info/10 text-info',
    Backend: 'bg-secondary/10 text-secondary',
    Testing: 'bg-success/10 text-success',
    DevOps: 'bg-warning/10 text-warning',
    Database: 'bg-primary/10 text-primary',
    Security: 'bg-error/10 text-error',
    'Code Quality': 'bg-info/10 text-info',
    Monitoring: 'bg-warning/10 text-warning',
    Documentation: 'bg-secondary/10 text-secondary',
    Product: 'bg-success/10 text-success',
  };

  const categoryColor = category ? categoryColors[category] || 'bg-bg-tertiary text-text-primary' : '';
  const TrendIcon =
    trendDirection === 'up' ? ArrowUpRight : trendDirection === 'down' ? ArrowDownRight : ArrowRight;
  const trendLabel =
    trendDirection === 'up'
      ? `Up ${Math.abs(trendDelta)}% vs monthly pace`
      : trendDirection === 'down'
        ? `Down ${Math.abs(trendDelta)}% vs monthly pace`
        : 'Flat vs monthly pace';
  const trendColor =
    trendDirection === 'up'
      ? 'text-success'
      : trendDirection === 'down'
        ? 'text-error'
        : 'text-text-muted';

  return (
    <Link href={`/agents/${agent['agent id']}`}>
      <div className="sel-card sel-card-hover h-full cursor-pointer p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {category && <span className={`sel-badge text-xs ${categoryColor}`}>{category}</span>}
          </div>
          <div className={`sel-badge whitespace-nowrap text-xs ${statusColor.bg} ${statusColor.text}`}>
            {agent.status}
          </div>
        </div>

        <div className="mb-3">
          <h3 className="line-clamp-2 text-lg font-semibold text-text-primary">{agent.name}</h3>
          {subcategory && <p className="mt-1 text-xs font-medium text-text-muted">{subcategory}</p>}
          <p className="mt-2 text-sm text-text-secondary">
            {agent.origin.org}
            {agent.origin.sub_org && ` / ${agent.origin.sub_org}`}
          </p>
        </div>

        <p className="mb-4 line-clamp-2 text-sm text-text-primary">{agent.description}</p>

        <div className="mb-4 flex items-center gap-4 text-xs text-text-secondary">
          <span>v{agent.version}</span>
          {agent.rating && (
            <span>
              {agent.rating.grade} ({agent.rating['Jast score']?.toFixed(1)})
            </span>
          )}
          {agent.stars !== undefined && <span>Star {agent.stars}</span>}
        </div>

        <div className="flex flex-wrap gap-1">
          {agent.technology.slice(0, 3).map((tech) => (
            <span key={tech} className="rounded px-2 py-1 text-xs font-medium text-text-primary bg-bg-tertiary">
              {tech}
            </span>
          ))}
          {agent.technology.length > 3 && (
            <span className="px-2 py-1 text-xs text-text-muted">+{agent.technology.length - 3} more</span>
          )}
        </div>

        {agent.downloads && (
          <div className="mt-4 border-t border-border pt-4 text-xs text-text-secondary">
            <div className="flex items-center justify-between gap-3">
              <p>{agent.downloads.total_download_overall.toLocaleString()} total downloads</p>
              <span className={`inline-flex items-center gap-1 font-medium ${trendColor}`}>
                <TrendIcon className="h-3.5 w-3.5" />
                {trendLabel}
              </span>
            </div>
            <p className="mt-2 text-text-muted">
              {agent.downloads.total_download_7_days.toLocaleString()} in 7 days •{' '}
              {agent.downloads.total_download_30_days.toLocaleString()} in 30 days
            </p>
          </div>
        )}

        <div className="mt-4 border-t border-border pt-4">
          <DownloadButton agent={agent} />
        </div>
      </div>
    </Link>
  );
}
