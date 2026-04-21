'use server';

import redis from './redis';
import { SELSkillCard } from '@/types';
import YAML from 'yaml';

/**
 * Get all skills from Redis
 * Returns array of skill cards with metadata
 */
export async function getAllSkills(): Promise<SELSkillCard[]> {
  try {
    const skillIds = await redis.smembers('skills:all');
    
    if (skillIds.length === 0) {
      return [];
    }

    const skills: SELSkillCard[] = [];

    for (const skillId of skillIds) {
      const yamlContent = await redis.get(`skill:${skillId}`);
      if (yamlContent) {
        try {
          const skillCard = YAML.parse(yamlContent) as SELSkillCard;
          skills.push(skillCard);
        } catch (parseError) {
          console.error(`Failed to parse YAML for skill ${skillId}:`, parseError);
        }
      }
    }

    return skills;
  } catch (error) {
    console.error('Error fetching all skills:', error);
    return [];
  }
}

/**
 * Get a single skill by ID
 */
export async function getSkillById(skillId: string): Promise<SELSkillCard | null> {
  try {
    const yamlContent = await redis.get(`skill:${skillId}`);
    
    if (!yamlContent) {
      return null;
    }

    const skillCard = YAML.parse(yamlContent) as SELSkillCard;
    return skillCard;
  } catch (error) {
    console.error(`Error fetching skill ${skillId}:`, error);
    return null;
  }
}

/**
 * Save a skill to Redis
 */
export async function saveSkill(skillCard: SELSkillCard): Promise<boolean> {
  try {
    const skillId = skillCard.skill_id;
    const yamlContent = YAML.stringify(skillCard);

    // Save YAML content
    await redis.set(`skill:${skillId}`, yamlContent);

    // Save metadata for faster querying
    await redis.hset(`skill:meta:${skillId}`, {
      name: skillCard.name,
      category: skillCard.category,
      difficulty_level: skillCard.difficulty_level,
      status: skillCard.status,
      rating: skillCard.ratings.average_rating.toString(),
      total_reviews: skillCard.ratings.total_reviews.toString(),
      total_enrolled: skillCard.learner_stats.total_enrolled.toString(),
    });

    // Index by category, status, and difficulty
    await redis.sadd(`skills:category:${skillCard.category}`, skillId);
    await redis.sadd(`skills:status:${skillCard.status}`, skillId);
    await redis.sadd(`skills:difficulty:${skillCard.difficulty_level}`, skillId);
    await redis.sadd('skills:all', skillId);

    return true;
  } catch (error) {
    console.error('Error saving skill:', error);
    return false;
  }
}

/**
 * Get skills by category
 */
export async function getSkillsByCategory(category: string): Promise<SELSkillCard[]> {
  try {
    const skillIds = await redis.smembers(`skills:category:${category}`);
    const skills: SELSkillCard[] = [];

    for (const skillId of skillIds) {
      const yamlContent = await redis.get(`skill:${skillId}`);
      if (yamlContent) {
        try {
          const skillCard = YAML.parse(yamlContent) as SELSkillCard;
          skills.push(skillCard);
        } catch (parseError) {
          console.error(`Failed to parse YAML for skill ${skillId}:`, parseError);
        }
      }
    }

    return skills;
  } catch (error) {
    console.error(`Error fetching skills for category ${category}:`, error);
    return [];
  }
}

/**
 * Get skills by difficulty level
 */
export async function getSkillsByDifficulty(
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
): Promise<SELSkillCard[]> {
  try {
    const skillIds = await redis.smembers(`skills:difficulty:${difficulty}`);
    const skills: SELSkillCard[] = [];

    for (const skillId of skillIds) {
      const yamlContent = await redis.get(`skill:${skillId}`);
      if (yamlContent) {
        try {
          const skillCard = YAML.parse(yamlContent) as SELSkillCard;
          skills.push(skillCard);
        } catch (parseError) {
          console.error(`Failed to parse YAML for skill ${skillId}:`, parseError);
        }
      }
    }

    return skills;
  } catch (error) {
    console.error(`Error fetching skills for difficulty ${difficulty}:`, error);
    return [];
  }
}

/**
 * Get skill count
 */
export async function getSkillCount(): Promise<number> {
  try {
    const count = await redis.scard('skills:all');
    return count;
  } catch (error) {
    console.error('Error fetching skill count:', error);
    return 0;
  }
}

/**
 * Delete a skill by ID
 */
export async function deleteSkill(skillId: string): Promise<boolean> {
  try {
    // Get the skill first to find its category and difficulty
    const yamlContent = await redis.get(`skill:${skillId}`);
    if (!yamlContent) {
      return false;
    }

    const skillCard = YAML.parse(yamlContent) as SELSkillCard;

    // Remove from all sets and hashes
    await redis.del(`skill:${skillId}`);
    await redis.del(`skill:meta:${skillId}`);
    await redis.srem(`skills:category:${skillCard.category}`, skillId);
    await redis.srem(`skills:status:${skillCard.status}`, skillId);
    await redis.srem(`skills:difficulty:${skillCard.difficulty_level}`, skillId);
    await redis.srem('skills:all', skillId);

    return true;
  } catch (error) {
    console.error(`Error deleting skill ${skillId}:`, error);
    return false;
  }
}

/**
 * Get featured skills (top rated)
 */
export async function getFeaturedSkills(limit: number = 6): Promise<SELSkillCard[]> {
  try {
    const allSkills = await getAllSkills();
    
    // Sort by rating and then by reviews
    allSkills.sort((a, b) => {
      const ratingDiff = b.ratings.average_rating - a.ratings.average_rating;
      if (ratingDiff !== 0) return ratingDiff;
      return b.ratings.total_reviews - a.ratings.total_reviews;
    });

    return allSkills.slice(0, limit);
  } catch (error) {
    console.error('Error fetching featured skills:', error);
    return [];
  }
}
