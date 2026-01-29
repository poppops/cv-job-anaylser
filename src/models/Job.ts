import { z } from "zod";

export const jobSchema = z.object({
    title: z.string(),
    description: z.string(),
    requirements: z.array(z.string()),
    benefits: z.array(z.string()),
    salary: z.number(),
    location: z.string(),
    company: z.string(),
    url: z.string(),
});