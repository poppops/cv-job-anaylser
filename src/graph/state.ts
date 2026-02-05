import { z } from "zod";
import { Annotation } from "@langchain/langgraph";
import { cvSchema } from "../models/CV";
import { jobSchema } from "../models/Job";
import { RecordMetadataValue } from "@pinecone-database/pinecone";

export type GraphState = {
    type?: string;
    cvFilename?: string;
    cvText?: string;
    jobText?: string;
    pendingJob?: z.infer<typeof jobSchema>;
    question?: string;
    cv?: z.infer<typeof cvSchema>;
    jobs: z.infer<typeof jobSchema>[];
    response: string;
    cvEvidence: (RecordMetadataValue | undefined)[];
    jobEvidence: (RecordMetadataValue | undefined)[];
};

export const GraphStateAnnotation = Annotation.Root({
    type: Annotation<string>(),
    cvFilename: Annotation<string>(),
    cvText: Annotation<string>(),
    jobText: Annotation<string>(),
    pendingJob: Annotation<z.infer<typeof jobSchema>>(),
    question: Annotation<string>(),
    cv: Annotation<z.infer<typeof cvSchema>>(),
    jobs: Annotation<z.infer<typeof jobSchema>[]>(),
    response: Annotation<string>(),
    cvEvidence: Annotation<(RecordMetadataValue | undefined)[]>(),
    jobEvidence: Annotation<(RecordMetadataValue | undefined)[]>(),
});