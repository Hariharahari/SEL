import { getAllAgents } from '@/lib/agentStore';
import { SELAgentCard } from '@/types';
import AgentsDirectoryClient from './page-client';

export default async function AgentsDirectoryPage() {
  let agents: SELAgentCard[] = [];
  let error: string | null = null;

  try {
    agents = await getAllAgents();
    agents = [...agents].sort((left, right) => {
      const rightOverall = right.downloads?.total_download_overall || 0;
      const leftOverall = left.downloads?.total_download_overall || 0;
      if (rightOverall !== leftOverall) {
        return rightOverall - leftOverall;
      }

      const rightWeekly = right.downloads?.total_download_7_days || 0;
      const leftWeekly = left.downloads?.total_download_7_days || 0;
      return rightWeekly - leftWeekly;
    });
  } catch (err) {
    console.error('Error loading agents:', err);
    error = 'Failed to load agents';
  }

  return <AgentsDirectoryClient initialAgents={agents} initialError={error} />;
}
