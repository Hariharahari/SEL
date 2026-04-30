import type { SELAgentCard } from '@/types';
import { getCategoryForSpecialization } from './categoryMapping';

export function getAgentCategory(agent: SELAgentCard) {
  const mapped = getCategoryForSpecialization(agent.specialization.primary);

  return {
    category: agent.categoryOverride || mapped.category,
    subcategory: agent.subcategoryOverride || mapped.subcategory,
  };
}
