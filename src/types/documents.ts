import { RecordMetadata } from "@pinecone-database/pinecone";

export type DocumentType = "cv" | "job";

export interface VectorMetadata extends RecordMetadata {
    doc_type: DocumentType;
    candidate_name?: string;
    job_id?: string;
    section: string;
    source_id: string;
}