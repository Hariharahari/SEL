import { pipeline } from '@xenova/transformers';
import { generateNvidiaEmbedding, hasNvidiaAccess } from './nvidia';
import { StoredSkillCard } from './skillSchema';

let embeddingPipeline: any = null;

async function initEmbeddingPipeline() {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
      { quantized: true }
    );
  }

  return embeddingPipeline;
}

async function generateLocalEmbedding(text: string): Promise<number[]> {
  const extractor = await initEmbeddingPipeline();
  const result = await extractor(text, {
    pooling: 'mean',
    normalize: true,
  });

  return Array.from(result.data);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (hasNvidiaAccess()) {
    try {
      return await generateNvidiaEmbedding(text);
    } catch (error) {
      console.error('NVIDIA embedding failed, falling back to local embeddings:', error);
    }
  }

  return generateLocalEmbedding(text);
}

export async function generateSkillEmbeddings(
  skills: StoredSkillCard[]
): Promise<Record<string, { embedding: number[]; skill: StoredSkillCard }>> {
  const embeddings: Record<string, { embedding: number[]; skill: StoredSkillCard }> = {};

  for (const skill of skills) {
    const skillText = [
      `Name: ${skill.name}`,
      `Description: ${skill.description}`,
      `Technology: ${skill.technology?.join(', ') || ''}`,
      `Primary specialization: ${skill.specialization.primary}`,
      `Domain: ${skill.specialization.domain_specific?.join(', ') || ''}`,
      `Tasks: ${skill.tasks?.map((task) => task.name).join(', ') || ''}`,
    ].join('\n');

    embeddings[skill.starterkit_id] = {
      embedding: await generateEmbedding(skillText),
      skill,
    };
  }

  return embeddings;
}
