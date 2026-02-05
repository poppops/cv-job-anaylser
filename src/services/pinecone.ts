import { Pinecone } from "@pinecone-database/pinecone";
import { VectorMetadata } from "../types/documents";

export const getPineconeIndex = () => {
    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY || ""
    });

    return pinecone.index({ host: process.env.PINCONE_HOST || "" });
}

export const upsertVector = async (id: string, embedding: number[], metaData: VectorMetadata): Promise<void> => {
    const pineconeIndex = getPineconeIndex();
    await pineconeIndex.upsert({
        records: [{
            id,
            values: embedding,
            metadata: metaData,
        }]
    })
}

export const queryVectors = async (embedding: number[], topK: number = 5, filter: Record<string, unknown>) => {
    const pineconeIndex = getPineconeIndex();
    const results = await pineconeIndex.query({
        vector: embedding,
        topK,
        filter,
        includeValues: true,
        includeMetadata: true,
    });

    return results.matches ?? [];
}