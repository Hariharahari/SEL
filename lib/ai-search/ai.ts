import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { StoredSkillCard } from '../skillSchema';
import { generateEmbedding } from '../embeddings';
import { loadFAISSIndex, getIndexPaths } from '../faiss';
import fs from 'fs';
import redis from '../redis';

// Initialize Groq client
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export interface SelectedSkill {
  id: string;
  reason: string;
}

export interface SkillSearchResult {
  starterkit_id: string;
  name: string;
  description: string;
  version: string;
  status: string;
  category?: string;
  subcategory?: string;
  technology?: string[];
  specialization?: {
    primary: string;
    domain_specific?: string[];
  };
  origin: {
    org: string;
    sub_org?: string;
    creator?: string;
  };
  maintainers: Array<{
    name: string;
    contact: string;
  }>;
  tasks: Array<{
    name: string;
    description: string;
    async: boolean;
    input_schema?: string;
    output_schema?: string;
  }>;
  rating?: {
    last_score?: number;
    grade?: string;
  };
  downloads?: {
    last_downloaded?: string;
    total_download_7_days?: number;
    total_download_30_days?: number;
    total_download_overall?: number;
    stars?: number;
  };
  documentation?: {
    readme: string;
    howto: string;
    changelog?: string;
  };
  supported_harness: string[];
  reason: string;
  confidence?: number;
}

// Build compressed context for LLM
function buildLLMContext(skill: StoredSkillCard) {
  return {
    id: skill.starterkit_id,
    name: skill.name,
    description: skill.description,
    category: skill.specialization?.primary || "",
    technology: skill.technology || [],
    capabilities: (skill.tasks || []).map(t => t.name).join(", "),
    use_cases: skill.specialization?.primary || "",
    quality_signal: `${skill.rating?.last_score || "N/A"} rating, ${skill.downloads?.total_download_overall || 0} downloads`
  };
}

// Semantic synonym map for enhanced matching (no embeddings)
const synonyms: Record<string, string[]> = {
  ai: ['machine learning', 'llm', 'nlp', 'artificial intelligence', 'deep learning'],
  security: ['vulnerability', 'auth', 'encryption', 'authentication', 'cybersecurity', 'authorization'],
  testing: ['unit test', 'integration test', 'qa', 'test automation', 'quality assurance'],
  backend: ['api', 'server', 'database', 'server-side', 'backend development'],
  frontend: ['ui', 'ux', 'client-side', 'web interface', 'user interface'],
  data: ['analytics', 'processing', 'pipeline', 'etl', 'data science'],
  cloud: ['aws', 'azure', 'gcp', 'infrastructure', 'deployment'],
  devops: ['ci/cd', 'deployment', 'infrastructure', 'automation'],
  database: ['storage', 'sql', 'nosql', 'data store', 'persistence'],
  web: ['http', 'rest', 'graphql', 'api', 'website'],
};

// Extract keywords from query (removes common stop words)
function extractKeywords(query: string): string[] {
  const stopWords = ['i', 'want', 'to', 'my', 'for', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'with', 'from', 'by', 'about', 'as', 'into', 'like', 'through', 'after', 'over', 'between', 'out', 'against', 'during', 'without', 'before', 'under', 'around', 'among'];
  const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 2 && !stopWords.includes(word));
  return words;
}

// Score skill based on query relevance with enhanced matching
function scoreSkill(skill: StoredSkillCard, query: string): number {
  const lowerQuery = query.toLowerCase();
  const keywords = extractKeywords(query);
  const words = query.toLowerCase().split(' ');
  let score = 0;

  // Direct full query matches (highest weight)
  if (skill.name.toLowerCase().includes(lowerQuery)) score += 5;
  if (skill.description.toLowerCase().includes(lowerQuery)) score += 3;
  
  // Category match - very high weight if category is explicitly mentioned
  if (skill.specialization?.primary?.toLowerCase().includes(lowerQuery)) score += 5;
  
  // Technology matches
  if (skill.technology?.some(tech => tech.toLowerCase().includes(lowerQuery))) score += 3;
  
  // Task matches
  if (skill.tasks?.some(task => task.name.toLowerCase().includes(lowerQuery))) score += 2;

  // Enhanced partial word matching (STEP 1)
  words.forEach(word => {
    if (word.length > 2) {
      if (skill.name.toLowerCase().includes(word)) score += 2;
      if (skill.description.toLowerCase().includes(word)) score += 1;
    }
  });

  // Semantic synonym matching (STEP 3)
  Object.entries(synonyms).forEach(([key, values]) => {
    if (query.includes(key) || values.some(v => query.includes(v))) {
      if (skill.description.toLowerCase().includes(key)) score += 2;
      values.forEach(synonym => {
        if (skill.description.toLowerCase().includes(synonym)) score += 1;
        if (skill.name.toLowerCase().includes(synonym)) score += 1;
      });
    }
  });

  // Keyword-based matching for partial matches
  keywords.forEach(keyword => {
    // Match against specialization
    if (skill.specialization?.primary?.toLowerCase().includes(keyword)) score += 2;
    if (skill.specialization?.domain_specific?.some(ds => ds.toLowerCase().includes(keyword))) score += 1;
    
    // Match against technology
    if (skill.technology?.some(tech => tech.toLowerCase().includes(keyword))) score += 2;
    
    // Match against tasks
    if (skill.tasks?.some(task => task.name.toLowerCase().includes(keyword))) score += 1;
    
    // Partial match in name or description
    if (skill.name.toLowerCase().includes(keyword)) score += 2;
    if (skill.description.toLowerCase().includes(keyword)) score += 1;
  });

  // Quality signal bonus (higher rated skills get slight boost)
  const ratingBonus = Math.min((skill.rating?.last_score || 0) / 20, 2);
  score += ratingBonus;

  return score;
}

/**
 * Perform vector search using FAISS
 * Returns top N most similar skills by embedding
 */
async function vectorSearch(queryEmbedding: number[], limit: number = 50): Promise<string[]> {
  console.log('[AI Search] Using FAISS for vector search');
  
  try {
    // Load FAISS index paths
    const indexPaths = getIndexPaths();
    
    if (!fs.existsSync(indexPaths.indexFile) || !fs.existsSync(indexPaths.metadataFile)) {
      console.log('[AI Search] FAISS index files not found, falling back to keyword search');
      return [];
    }
    
    // Load FAISS index data
    const indexData = JSON.parse(fs.readFileSync(indexPaths.indexFile, 'utf-8'));
    const metadata = JSON.parse(fs.readFileSync(indexPaths.metadataFile, 'utf-8'));
    
    // Simple cosine similarity search (since we don't have actual FAISS library)
    const similarities: Array<{ skillId: string; similarity: number }> = [];
    
    for (const [skillId, skillData] of Object.entries(metadata)) {
      const skillDataTyped = skillData as { index: number; skill_id: string; name: string; version: string };
      const skillEmbedding = indexData.embeddings[skillDataTyped.index];
      if (skillEmbedding) {
        // Calculate cosine similarity
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < queryEmbedding.length; i++) {
          dotProduct += queryEmbedding[i] * skillEmbedding[i];
          normA += queryEmbedding[i] * queryEmbedding[i];
          normB += skillEmbedding[i] * skillEmbedding[i];
        }
        
        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);
        
        const similarity = dotProduct / (normA * normB);
        similarities.push({ skillId, similarity });
      }
    }
    
    // Sort by similarity and return top N
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, limit).map(item => item.skillId);
  } catch (error) {
    console.error('[AI Search] Vector search failed:', error);
    return [];
  }
}

/**
 * Get skill by ID from Redis using existing schema
 */
async function getSkillById(skillId: string): Promise<StoredSkillCard | null> {
  try {
    const latestVersion = await redis.get(`skill:${skillId}:latest`);
    if (!latestVersion) return null;

    const data = await redis.get(`skill:${skillId}:${latestVersion}`);
    if (!data) return null;

    return JSON.parse(data) as StoredSkillCard;
  } catch (error) {
    console.error(`[AI Search] Failed to get skill ${skillId}:`, error);
    return null;
  }
}

export async function searchSkills(query: string): Promise<SkillSearchResult[]> {
  const systemPrompt = `You are an intelligent system that selects the best skills to solve a user's problem.

Follow this reasoning process:

1. Understand the user's intent clearly
2. Identify required capabilities
3. Match skills to those capabilities
4. Prefer:
   * highly relevant and specific skills
   * complementary skills that work together
   * high-quality or widely-used skills

Return ONLY the best 3–5 skills.

OUTPUT FORMAT (STRICT JSON):
{
"selected_skills": [
{
"id": "...",
"reason": "Explain why this skill is relevant and how it contributes to solving the problem"
}
]
}`;

  try {
    const startTime = Date.now();
    
    // Fetch skills directly from Redis (bypass authentication)
    const skillIds = await redis.smembers("skills:index");
    const skills: StoredSkillCard[] = [];

    await Promise.all(
      skillIds.map(async (skillId) => {
        const latestVersion = await redis.get(`skill:${skillId}:latest`);
        if (!latestVersion) return;

        const data = await redis.get(`skill:${skillId}:${latestVersion}`);
        if (!data) return;

        const skill = JSON.parse(data) as StoredSkillCard;

        // only approved skills
        if (!skill.is_approved) return;

        skills.push(skill);
      })
    );

    console.log(`[AI Search] Total skills: ${skills.length}`);

    let skillsToScore: StoredSkillCard[] = skills;
    let usedVectorSearch = false;

    // Try semantic search with embeddings
    try {
      const embeddingStartTime = Date.now();
      const queryEmbedding = await generateEmbedding(query);
      const embeddingTime = Date.now() - embeddingStartTime;
      console.log(`[AI Search] Query embedding generated in ${embeddingTime}ms`);

      const vectorSearchStartTime = Date.now();
      // Use our own vector search implementation since we don't have searchEmbeddings
      const vectorResultIds = await vectorSearch(queryEmbedding, 50);
      const vectorSearchTime = Date.now() - vectorSearchStartTime;
      console.log(`[AI Search] Vector search completed in ${vectorSearchTime}ms, found ${vectorResultIds.length} skills`);

      // Fetch skill data from Redis for FAISS results
      if (vectorResultIds.length > 0) {
        const vectorSkills = await Promise.all(
          vectorResultIds.map(async (skillId) => {
            const skill = await getSkillById(skillId);
            return skill;
          })
        );
        skillsToScore = vectorSkills.filter((s): s is StoredSkillCard => s !== null);
        usedVectorSearch = true;
        console.log(`[AI Search] Using FAISS search results: ${skillsToScore.length} skills`);
      }
    } catch (embeddingError) {
      console.error('[AI Search] Embedding generation or vector search failed:', embeddingError);
      console.log('[AI Search] Falling back to keyword-based search without FAISS');
      // Continue with all skills (fallback to original behavior)
      usedVectorSearch = false;
    }

    // Pre-filter: Score skills (either vector-filtered or all)
    const scoredSkills = skillsToScore
      .map(skill => ({ skill, score: scoreSkill(skill, query) }))
      .sort((a, b) => b.score - a.score);

    // Adaptive filtering (STEP 4) - smarter top-N based on max score
    const maxScore = scoredSkills.length > 0 ? scoredSkills[0].score : 0;
    let topN = 30;
    if (maxScore > 8) topN = 15;       // strong matches
    else if (maxScore < 3) topN = 40;  // weak matches

    const topSkills = scoredSkills.slice(0, topN);

    console.log(`[AI Search] Max score: ${maxScore}`);
    console.log(`[AI Search] Adaptive top-N: ${topN}`);
    console.log(`[AI Search] Filtered to top ${topSkills.length} skills`);
    console.log(`[AI Search] Used vector search: ${usedVectorSearch}`);

    // Build compressed context for LLM
    const llmContext = topSkills.map(item => buildLLMContext(item.skill));

    const llmStartTime = Date.now();
    const result = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: systemPrompt,
      prompt: `Query: ${query}\n\nAvailable Skills:\n${JSON.stringify(llmContext, null, 2)}`,
      temperature: 0.1,
    });
    const llmEndTime = Date.now();
    const llmResponseTime = llmEndTime - llmStartTime;

    // Extract JSON from response (in case model adds extra text)
    const text = result.text.trim();
    let jsonString = text;

    console.log(`[AI Search] Raw LLM response length: ${text.length}`);

    // Try to extract JSON if there's extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
      console.log(`[AI Search] Extracted JSON length: ${jsonString.length}`);
    } else {
      console.log(`[AI Search] No JSON found in response, using raw text`);
    }

    // Parse the AI response
    let response;
    try {
      response = JSON.parse(jsonString);
    } catch (parseError) {
      console.error(`[AI Search] JSON parse error:`, parseError);
      console.error(`[AI Search] Failed to parse:`, jsonString.substring(0, 200) + '...');
      throw new Error('Failed to parse LLM response as JSON');
    }

    const selectedSkills: SelectedSkill[] = response.selected_skills || [];

    console.log(`[AI Search] LLM selected ${selectedSkills.length} skills`);
    console.log(`[AI Search] LLM response time: ${llmResponseTime}ms`);

    // Calculate confidence score (STEP 6)
    const confidence = Math.min(95, 60 + (topSkills.length * 1.2));
    console.log(`[AI Search] Confidence score: ${confidence.toFixed(1)}%`);

    // Map IDs back to full agent objects with reasons
    const results: SkillSearchResult[] = selectedSkills
      .map((selected) => {
        const skill = skills.find((s) => s.starterkit_id === selected.id);
        if (!skill) return null;
        return {
          starterkit_id: skill.starterkit_id,
          name: skill.name,
          description: skill.description,
          version: skill.version,
          status: skill.status,
          category: skill.specialization?.primary,
          subcategory: skill.specialization?.domain_specific?.[0],
          technology: skill.technology,
          specialization: skill.specialization,
          origin: skill.origin,
          maintainers: skill.maintainers,
          tasks: skill.tasks,
          rating: skill.rating,
          downloads: skill.downloads,
          documentation: skill.documentation,
          supported_harness: skill.supported_harness,
          reason: selected.reason,
          confidence: confidence,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const totalTime = Date.now() - startTime;
    console.log(`[AI Search] Total search time: ${totalTime}ms`);

    return results;
  } catch (error) {
    console.error('Error in AI skill search:', error);
    throw new Error('Failed to search skills using AI');
  }
}
