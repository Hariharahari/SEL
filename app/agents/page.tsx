import { getAllAgents } from '@/lib/agentStore';
import { SELAgentCard } from '@/types';
import AgentsDirectoryClient from './page-client';

export default async function AgentsDirectoryPage() {
  let agents: SELAgentCard[] = [];
  let error: string | null = null;

  try {
    agents = await getAllAgents();
  } catch (err) {
    console.error('Error loading agents:', err);
    error = 'Failed to load agents';
  }

  return <AgentsDirectoryClient initialAgents={agents} initialError={error} />;
}
