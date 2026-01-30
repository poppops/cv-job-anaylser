import { z } from "zod";

export const jobFitSchema = z.object({
    fit: z.number().describe("A percentage score of the fit between the CV and the job description"),
    reasons: z.array(z.string()).describe("The reasons for the fit score"),
    skillsMatch: z.array(z.string()).describe("The skills that match the job description"),
    skillsMissing: z.array(z.string()).describe("The skills that are missing from the CV"),
});