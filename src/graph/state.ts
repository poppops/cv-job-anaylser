import { z } from "zod";
import { Annotation } from "@langchain/langgraph";
import { cvSchema } from "../models/CV";
import { jobSchema } from "../models/Job";
import { jobFitSchema } from "../models/JobFit";

export type GraphState = {
    type?: string;
    cvText?: string;
    jobText?: string;
    pendingJob?: z.infer<typeof jobSchema>;
    question?: string;
    cv?: z.infer<typeof cvSchema>;
    jobs: z.infer<typeof jobSchema>[];
    jobFits: z.infer<typeof jobFitSchema>[];
    response: string;
};

export const GraphStateAnnotation = Annotation.Root({
    type: Annotation<string>(),
    cvText: Annotation<string>(),
    jobText: Annotation<string>(),
    pendingJob: Annotation<z.infer<typeof jobSchema>>(),
    question: Annotation<string>(),
    cv: Annotation<z.infer<typeof cvSchema>>(),
    jobs: Annotation<z.infer<typeof jobSchema>[]>(),
    jobFits: Annotation<z.infer<typeof jobFitSchema>[]>(),
    response: Annotation<string>(),
});