import { z } from "zod";

export const cvSchema = z.object({
    name: z.string(),
    summary: z.string().describe("A brief summary of the candidate's skills and experience"),
    strengths: z.string().describe("A list of the candidate's strengths"),
    skills: z.array(z.object({
        name: z.string().describe("The name of the skill"),
        description: z.string().describe("A description of the skill"),
        level: z.enum(["beginner", "intermediate", "advanced"]).describe("The level of the skill"),
    })).describe("A list of the candidate's skills"),
});