import fs from 'fs';
import path from 'path';

export interface VectorIndexRecord {
  id: string;
  kind: 'agent';
  name: string;
  version: string;
  status: string;
  text: string;
  embedding: number[];
  updatedAt: string;
}

interface VectorIndexFile {
  dimension: number;
  records: VectorIndexRecord[];
}

const FAISS_INDEX_DIR = path.join(process.cwd(), 'faiss_index');
const INDEX_FILE = path.join(FAISS_INDEX_DIR, 'index.faiss');
const METADATA_FILE = path.join(FAISS_INDEX_DIR, 'index.pkl');

function emptyIndex(): VectorIndexFile {
  return {
    dimension: 0,
    records: [],
  };
}

export function ensureIndexDir(): void {
  if (!fs.existsSync(FAISS_INDEX_DIR)) {
    fs.mkdirSync(FAISS_INDEX_DIR, { recursive: true });
  }
}

function loadIndexData(): VectorIndexFile {
  ensureIndexDir();

  if (!fs.existsSync(INDEX_FILE)) {
    return emptyIndex();
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8')) as VectorIndexFile;
    if (!Array.isArray(parsed.records)) {
      return emptyIndex();
    }
    return parsed;
  } catch (error) {
    console.error('Failed to read vector index, rebuilding:', error);
    return emptyIndex();
  }
}

function persistIndexData(data: VectorIndexFile) {
  ensureIndexDir();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(data, null, 2));
  const metadata = Object.fromEntries(
    data.records.map((record, index) => [
      record.id,
      {
        id: record.id,
        kind: record.kind,
        name: record.name,
        version: record.version,
        status: record.status,
        index,
        updatedAt: record.updatedAt,
      },
    ])
  );
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
}

export async function upsertVectorRecord(record: VectorIndexRecord): Promise<void> {
  const data = loadIndexData();
  const nextRecords = data.records.filter((item) => item.id !== record.id);
  nextRecords.push(record);

  persistIndexData({
    dimension: record.embedding.length,
    records: nextRecords,
  });
}

export async function saveEmbeddingsToFAISS(
  embeddings: Record<
    string,
    {
      embedding: number[];
      skill: {
        starterkit_id: string;
        name: string;
        version: string;
        status?: string;
      };
    }
  >
): Promise<void> {
  for (const [id, entry] of Object.entries(embeddings)) {
    await upsertVectorRecord({
      id,
      kind: 'agent',
      name: entry.skill.name,
      version: entry.skill.version,
      status: entry.skill.status || 'approved',
      text: entry.skill.name,
      embedding: entry.embedding,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function removeVectorRecord(id: string): Promise<void> {
  const data = loadIndexData();
  persistIndexData({
    dimension: data.records[0]?.embedding.length || 0,
    records: data.records.filter((record) => record.id !== id),
  });
}

function cosineSimilarity(a: number[], b: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  const dimension = Math.min(a.length, b.length);
  for (let index = 0; index < dimension; index += 1) {
    dotProduct += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (!normA || !normB) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function searchVectorIndex(queryEmbedding: number[], limit = 12) {
  const data = loadIndexData();

  return data.records
    .map((record) => ({
      id: record.id,
      similarity: cosineSimilarity(queryEmbedding, record.embedding),
      record,
    }))
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, limit);
}

export function loadFAISSIndex() {
  if (!fs.existsSync(INDEX_FILE) || !fs.existsSync(METADATA_FILE)) {
    return null;
  }

  return {
    index: INDEX_FILE,
    metadata: METADATA_FILE,
  };
}

export function getIndexPaths() {
  return {
    indexFile: INDEX_FILE,
    metadataFile: METADATA_FILE,
  };
}

export function indexExists(): boolean {
  return fs.existsSync(INDEX_FILE) && fs.existsSync(METADATA_FILE);
}
