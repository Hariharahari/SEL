/**
 * Agent Store - Functions for Redis CRUD operations
 * Manages all agent data stored in the Redis Hash: agents_catalog
 */

import 'server-only';
import redis from './redis';
import { SELAgentCard } from '@/types';

const AGENTS_HASH_KEY = 'agents_catalog';

/**
 * Fetch all agents from Redis
 * Returns an array of SELAgentCard objects
 */
export async function getAllAgents(): Promise<SELAgentCard[]> {
  try {
    const agents = await redis.hgetall(AGENTS_HASH_KEY);
    
    if (!agents || Object.keys(agents).length === 0) {
      return [];
    }

    // Parse all JSON strings back to objects
    return Object.values(agents).map((agentJson) => {
      try {
        return JSON.parse(agentJson);
      } catch (err) {
        console.error('Error parsing agent JSON:', err);
        return null;
      }
    }).filter((agent): agent is SELAgentCard => agent !== null);
  } catch (error) {
    console.error('Error fetching all agents from Redis:', error);
    return [];
  }
}

/**
 * Fetch a single agent by ID from Redis
 * Returns the agent or null if not found
 */
export async function getAgentById(agentId: string): Promise<SELAgentCard | null> {
  try {
    const agentJson = await redis.hget(AGENTS_HASH_KEY, agentId);
    
    if (!agentJson) {
      return null;
    }

    return JSON.parse(agentJson);
  } catch (error) {
    console.error(`Error fetching agent ${agentId} from Redis:`, error);
    return null;
  }
}

/**
 * Save a single agent to Redis
 * Stores the agent in the Redis Hash using agent id as the key
 */
export async function saveAgent(agent: SELAgentCard): Promise<boolean> {
  try {
    const agentJson = JSON.stringify(agent);
    await redis.hset(AGENTS_HASH_KEY, agent['agent id'], agentJson);
    return true;
  } catch (error) {
    console.error(`Error saving agent ${agent['agent id']} to Redis:`, error);
    return false;
  }
}

/**
 * Delete an agent from Redis by ID
 */
export async function deleteAgent(agentId: string): Promise<boolean> {
  try {
    const result = await redis.hdel(AGENTS_HASH_KEY, agentId);
    return result > 0;
  } catch (error) {
    console.error(`Error deleting agent ${agentId} from Redis:`, error);
    return false;
  }
}

/**
 * Get the total count of agents in Redis
 */
export async function getAgentCount(): Promise<number> {
  try {
    return await redis.hlen(AGENTS_HASH_KEY);
  } catch (error) {
    console.error('Error getting agent count:', error);
    return 0;
  }
}
