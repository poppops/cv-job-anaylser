import { Request, Response } from "express";
import { unlink } from "fs/promises";
import { loadDocuments, parseCV } from "../../utils/documents";

export const processCVFile = async (req: Request, res: Response) => {
    const { file } = req;

    if (!file || !file.path) {
        return res.status(400).json({ message: "Please upload a CV file" });
    }

    try {
        const documents = await loadDocuments(file);
        const parsedCV = await parseCV(documents[0]?.pageContent || "");

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
