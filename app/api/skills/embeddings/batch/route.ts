import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
import {
  saveEmbeddingsToFAISS,
  indexExists,
  getIndexPaths,
} from "@/lib/faiss";

export const POST = async (req: NextRequest) => {
  try {
    // 1. Retrieve pending embeddings from Redis
    const embeddingsData = await redis.get("embeddings:pending");

    if (!embeddingsData) {
      return NextResponse.json(
        { detail: "No pending embeddings found. Run generate endpoint first." },
        { status: 400 }
      );
    }

    const embeddings = JSON.parse(embeddingsData);

    if (Object.keys(embeddings).length === 0) {
      return NextResponse.json(
        { detail: "No embeddings to save" },
        { status: 400 }
      );
    }

    // 2. Save embeddings to FAISS
    await saveEmbeddingsToFAISS(embeddings);

    // 3. Clear pending embeddings from Redis
    await redis.del("embeddings:pending");

    // 4. Store metadata about the batch
    const indexPaths = getIndexPaths();
    const batchInfo = {
      created_at: new Date().toISOString(),
      embeddings_count: Object.keys(embeddings).length,
      index_file: indexPaths.indexFile,
      metadata_file: indexPaths.metadataFile,
    };

    await redis.set("embeddings:batch_info", JSON.stringify(batchInfo));

    return NextResponse.json(
      {
        message: "Embeddings saved to FAISS successfully",
        embeddings_count: Object.keys(embeddings).length,
        index_exists: indexExists(),
        index_paths: indexPaths,
        batch_info: batchInfo,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving embeddings to FAISS:", error);
    return NextResponse.json(
      {
        detail: "Failed to save embeddings to FAISS",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
