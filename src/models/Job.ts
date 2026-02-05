import { z } from "zod";

export const jobSchema = z.object({
    title: z.string(),
    description: z.string(),
    requirements: z.array(z.object({
        name: z.string(),
        description: z.string(),
        level: z.enum(["beginner", "intermediate", "advanced"]),
    })),
    benefits: z.array(z.string()),
    salary: z.number(),
    location: z.string(),
    company: z.string(),
    url: z.string(),
});