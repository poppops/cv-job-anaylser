import { Request, Response } from "express";

export const processJobs = async (req: Request, res: Response) => {
    const { jobUrls } = req.body;

    if (!jobUrls || jobUrls.length === 0) {
        return res.status(400).json({ message: "Please provide at least one job URL" });
    }

    const jobs = await Promise.all(jobUrls.map(async (url: string) => {
        const job = await fetch(url);
        return job.json();
    }));

    res.json(jobs);
}