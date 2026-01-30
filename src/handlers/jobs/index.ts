import { Request, Response } from "express";
import { loadDocuments, parseJob } from "../../utils/documents";

export const processJobs = async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
        return res.status(400).json({ message: "Please provide at least one job file" });
    }

    const jobs = await Promise.all(
        files.map(async (file) => {
            const documents = await loadDocuments(file);
            return await parseJob(documents[0]?.pageContent ?? "");
        })
    );

    res.json(jobs);
}