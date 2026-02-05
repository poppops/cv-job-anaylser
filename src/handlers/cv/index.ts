import { Request, Response } from "express";
import { unlink } from "fs/promises";
import { assessJobFit, loadDocuments, parseCV } from "../../utils/documents";
import { upsertVector } from "../../services/pinecone";
import { embedText } from "../../utils/embeddings";

export const processCVFile = async (req: Request, res: Response) => {
    const { file } = req;

    if (!file || !file.path) {
        return res.status(400).json({ message: "Please upload a CV file" });
    }

    try {
        const documents = await loadDocuments(file);
        const parsedCV = await parseCV(documents[0]?.pageContent || "");

        for (const section of ['name', 'summary', 'strengths']) {
            const embedding = await embedText(parsedCV[section]);

            if (!embedding) {
                continue;
            }

            await upsertVector(section, embedding, {
                doc_type: "cv",
                candidate_name: parsedCV.name,
                section,
                source_id: file.filename,
                text: parsedCV[section],
            });
        }

        for (const skill of parsedCV.skills) {
            const embedding = await embedText(JSON.stringify(skill));

            if (!embedding) {
                continue;
            }

            await upsertVector(skill.name, embedding, {
                doc_type: "cv",
                candidate_name: parsedCV.name,
                section: "skills - " + skill.name,
                source_id: file.filename,
            });
        }

        res.json(parsedCV);
    } catch (error) {
        res.status(500).json({
            error: "Failed to process file",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    } finally {
        if (file.path) {
            try {
                await unlink(file.path);
            } catch (cleanupError) {
                console.error("Failed to cleanup temp file:", cleanupError);
            }
        }
    }
};

export const processJobSuitability = async (req: Request, res: Response) => {
    const { cv, job } = req.body;
    const jobFit = await assessJobFit(cv, job);
    res.json(jobFit);
}