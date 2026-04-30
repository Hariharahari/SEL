import OpenAI from 'openai';
import type { AgentAnalysis, SELAgentCard } from '@/types';
import { CATEGORIES, SUBCATEGORIES_BY_CATEGORY, getCategoryForSpecialization } from './categoryMapping';

interface AgentAnalysisStats {
  totalDownloads: number;
  weeklyDownloads: number;
  monthlyDownloads: number;
  lastDownloaded: string | null;
}

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_EMBEDDING_MODEL = process.env.NVIDIA_EMBEDDING_MODEL || 'nvidia/nv-embedqa-e5-v5';
const DEFAULT_ANALYSIS_MODEL = process.env.NVIDIA_ANALYSIS_MODEL || 'meta/llama-3.1-70b-instruct';

function getNvidiaClient(): OpenAI | null {
  if (!process.env.NVIDIA_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: NVIDIA_BASE_URL,
  });
}

export function hasNvidiaAccess() {
  return Boolean(process.env.NVIDIA_API_KEY);
}

export async function generateNvidiaEmbedding(text: string): Promise<number[]> {
  const client = getNvidiaClient();
  if (!client) {
    throw new Error('NVIDIA_API_KEY is not configured');
  }

  const response = await client.embeddings.create({
    model: DEFAULT_EMBEDDING_MODEL,
    input: text,
  });

  const embedding = response.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error('NVIDIA embedding response did not include a vector');
  }

  return embedding;
}

function fallbackAnalysis(agent: SELAgentCard, stats: AgentAnalysisStats): AgentAnalysis {
  return {
    summary: `${agent.name} is positioned for ${agent.specialization.primary} workflows with ${stats.totalDownloads} recorded downloads so far.`,
    strengths: [
      `Focused on ${agent.specialization.primary} use cases`,
      `${agent.tasks.length} documented task${agent.tasks.length === 1 ? '' : 's'}`,
      `${agent.technology.length} declared technology tag${agent.technology.length === 1 ? '' : 's'}`,
    ],
    recommended_use_cases: [
      agent.description,
      ...agent.tasks.slice(0, 2).map((task) => task.description),
    ].filter(Boolean),
    adoption_signals: [
      `Total downloads: ${stats.totalDownloads}`,
      `Last 7 days: ${stats.weeklyDownloads}`,
      `Last 30 days: ${stats.monthlyDownloads}`,
      stats.lastDownloaded ? `Last downloaded: ${stats.lastDownloaded}` : 'No downloads recorded yet',
    ],
    model: 'fallback-local-analysis',
    generated_at: new Date().toISOString(),
  };
}

export async function generateAgentAnalysis(
  agent: SELAgentCard,
  stats: AgentAnalysisStats
): Promise<AgentAnalysis> {
  const client = getNvidiaClient();
  if (!client) {
    return fallbackAnalysis(agent, stats);
  }

  try {
    const response = await client.chat.completions.create({
      model: DEFAULT_ANALYSIS_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You are an enterprise AI catalog analyst. Return strict JSON with keys summary, strengths, recommended_use_cases, adoption_signals.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            agent: {
              id: agent['agent id'],
              name: agent.name,
              description: agent.description,
              status: agent.status,
              version: agent.version,
              specialization: agent.specialization,
              technology: agent.technology,
              tasks: agent.tasks,
            },
            stats,
          }),
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim() || '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as Partial<AgentAnalysis>;

    return {
      summary: parsed.summary || fallbackAnalysis(agent, stats).summary,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : fallbackAnalysis(agent, stats).strengths,
      recommended_use_cases: Array.isArray(parsed.recommended_use_cases)
        ? parsed.recommended_use_cases
        : fallbackAnalysis(agent, stats).recommended_use_cases,
      adoption_signals: Array.isArray(parsed.adoption_signals)
        ? parsed.adoption_signals
        : fallbackAnalysis(agent, stats).adoption_signals,
      model: DEFAULT_ANALYSIS_MODEL,
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to generate NVIDIA agent analysis:', error);
    return fallbackAnalysis(agent, stats);
  }
}

export async function suggestAgentCategory(
  agent: SELAgentCard
): Promise<{ category: string; subcategory: string; model: string }> {
  const fallback = getCategoryForSpecialization(agent.specialization.primary);
  const client = getNvidiaClient();

  if (!client) {
    return {
      ...fallback,
      model: 'fallback-specialization-map',
    };
  }

  try {
    const response = await client.chat.completions.create({
      model: DEFAULT_ANALYSIS_MODEL,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'You classify enterprise AI skills into one allowed category and one allowed subcategory. Return strict JSON with keys category and subcategory only.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            allowed_categories: CATEGORIES,
            allowed_subcategories: SUBCATEGORIES_BY_CATEGORY,
            skill: {
              id: agent['agent id'],
              name: agent.name,
              description: agent.description,
              technology: agent.technology,
              specialization: agent.specialization,
              tasks: agent.tasks,
            },
          }),
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim() || '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as {
      category?: string;
      subcategory?: string;
    };

    const category = parsed.category && CATEGORIES.includes(parsed.category) ? parsed.category : fallback.category;
    const allowedSubcategories = SUBCATEGORIES_BY_CATEGORY[category] || [];
    const subcategory =
      parsed.subcategory && allowedSubcategories.includes(parsed.subcategory)
        ? parsed.subcategory
        : allowedSubcategories.includes(fallback.subcategory)
          ? fallback.subcategory
          : allowedSubcategories[0] || fallback.subcategory;

    return {
      category,
      subcategory,
      model: DEFAULT_ANALYSIS_MODEL,
    };
  } catch (error) {
    console.error('Failed to categorize skill with NVIDIA:', error);
    return {
      ...fallback,
      model: 'fallback-specialization-map',
    };
  }
}
