import type { SELAgentCard } from '@/types';

export function calculateTrendDelta(agent: SELAgentCard) {
  const weekly = agent.downloads?.total_download_7_days || 0;
  const monthly = agent.downloads?.total_download_30_days || 0;
  if (monthly === 0) {
    return weekly > 0 ? 100 : 0;
  }

  const baselineWeekly = monthly / 4;
  return Math.round(((weekly - baselineWeekly) / baselineWeekly) * 100);
}

export function getTrendDirection(agent: SELAgentCard) {
  const delta = calculateTrendDelta(agent);
  if (delta > 5) return 'up';
  if (delta < -5) return 'down';
  return 'flat';
}
