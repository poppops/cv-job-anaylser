import { Request, Response } from "express";
import { loadDocuments, parseJob } from "../../utils/documents";
import OpenAI from "openai";
import { upsertVector } from "../../services/pinecone";
import { embedText } from "../../utils/embeddings";

export const processJobs = async (req: Request, res: Response) => {
    console.log("Processing jobs");
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
        return res.status(400).json({ message: "Please provide at least one job file" });
    }

    console.log("Files:", files.length);
    const jobs = await Promise.all(
        files.map(async (file) => {
            const documents = await loadDocuments(file);
            const parsedJob = await parseJob(documents[0]?.pageContent ?? "");

            const client = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY || ""
            });

            for (const section of ['title', 'description', 'benefits', 'location', 'company']) {
                console.log("Embedding section:", section, parsedJob[section]);

                let embedding: any;
                switch (section) {
                    case 'benefits':
                        embedding = await embedText(JSON.stringify(parsedJob[section]));
                        break;

                    default:
                        embedding = await embedText(parsedJob[section]);
                        break;
                }

                if (!embedding) {
                    return parsedJob;
                }

                await upsertVector(section, embedding, {
                    doc_type: "job",
                    section,
                    source_id: file.filename,
                    job_id: parsedJob.title,
                    text: parsedJob[section],
                });
            }

            for (const requirement of parsedJob.requirements) {
                const embedding = await client.embeddings.create({
                    model: "text-embedding-3-small",
                    input: JSON.stringify(requirement),
                    dimensions: 512,
                });

                if (!embedding.data[0]?.embedding) {
                    continue;
                }

                await upsertVector(requirement.name, embedding.data[0]?.embedding, {
                    doc_type: "job",
                    section: "requirements" + requirement.name,
                    source_id: file.filename,
                    job_id: parsedJob.title,
                    text: JSON.stringify(requirement),
                });
            }

            return parsedJob;
        })
    );

    res.json(jobs);
}