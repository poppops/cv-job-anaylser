import { readFile } from "node:fs/promises";
import mammoth from "mammoth";

type Document = { pageContent: string; metadata?: Record<string, unknown> };
import PdfParse from "pdf-parse";
import openai from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { cvSchema } from "../models/CV";
import * as unpdf from "unpdf";
import { jobSchema } from "../models/Job";
import { jobFitSchema } from "../models/JobFit";

export const loadDocuments = async (file: Express.Multer.File) => {
    let documents: Document[];

    if (file.mimetype === "application/pdf") {
        const pdfBuffer = await readFile(file.path);
        let pageContent: string;
        let metadata: Record<string, unknown> = {};

        try {
            const pdfData = await PdfParse(pdfBuffer);
            pageContent = pdfData.text;
            metadata = { ...pdfData.info };

            // meaningfulRatio = proportion of non-whitespace chars (e.g. 0.1 = 90% whitespace)
            // Low ratio + few chars = pdf-parse likely failed (e.g. print-to-PDF returns mostly newlines)
            const meaningfulChars = pageContent.replace(/\s/g, "").length;
            const totalChars = pageContent.length || 1;
            const meaningfulRatio = meaningfulChars / totalChars;

            if (meaningfulRatio < 0.2 && meaningfulChars < 100) {
                try {
                    const pdf = await unpdf.getDocumentProxy(new Uint8Array(pdfBuffer));
                    const { text } = await unpdf.extractText(pdf, { mergePages: true });
                    if (text && text.trim().length > meaningfulChars) {
                        pageContent = text;
                    }
                } catch {
                    /* unpdf can fail: corrupted PDF, password-protected, unsupported encoding */
                    /* Keep pdf-parse result (even if mostly whitespace) */
                }
            }
        } catch {
            try {
                const pdf = await unpdf.getDocumentProxy(new Uint8Array(pdfBuffer));
                const { text } = await unpdf.extractText(pdf, { mergePages: true });
                pageContent = text ?? "";
            } catch {
                pageContent = "";
            }
        }

        documents = [
            {
                pageContent,
                metadata: {
                    source: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    ...metadata,
                },
            },
        ];
    } else if (
        file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
        const result = await mammoth.extractRawText({ path: file.path });
        const pageContent = result.value ?? "";
        documents = [
            {
                pageContent,
                metadata: {
                    source: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                },
            },
        ];
    } else if (file.mimetype.startsWith("text/")) {
        const pageContent = await readFile(file.path, "utf-8");
        documents = [
            {
                pageContent,
                metadata: {
                    source: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                },
            },
        ];
    } else {
        throw new Error(`Unsupported file type: ${file.mimetype}. Please upload a PDF, DOCX, or text file.`);
    }

    return documents;

}

export const parseCV = async (cvText: string) => {
    const client = new openai({
        apiKey: process.env.OPENAI_API_KEY || ""
    });

    const parsedCV = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You are a helpful assistant that analyses CVs and jobs",
            },
            {
                role: "user",
                content: `Analyse the following CV :\n\n${cvText}`,
            },
        ],
        response_format: zodResponseFormat(cvSchema, "cv"),
    });

    return JSON.parse(parsedCV.choices[0]?.message.content || "{}");
}

export const parseJob = async (jobText: string) => {
    const client = new openai({
        apiKey: process.env.OPENAI_API_KEY || ""
    });

    const parsedCV = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You are a helpful assistant that analyses CVs and jobs",
            },
            {
                role: "user",
                content: `Analyse the following job description :\n\n${jobText}`,
            },
        ],
        response_format: zodResponseFormat(jobSchema, "cv"),
    });

    return JSON.parse(parsedCV.choices[0]?.message.content || "{}");
}

export const assessJobFit = async (
    cv: z.infer<typeof cvSchema>,
    job: z.infer<typeof jobSchema>
) => {
    const client = new openai({
        apiKey: process.env.OPENAI_API_KEY || ""
    });

    const assessedJobFit = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You are a helpful assistant that assesses the fit between a CV and a job description",
            },
            {
                role: "user",
                content: `Assess the fit between the following CV and job description :\n\nCV:\n\n${JSON.stringify(cv)}\n\nJob Description:\n\n${JSON.stringify(job)}`,
            }
        ],
        response_format: zodResponseFormat(jobFitSchema, "jobFit"),
    });

    return JSON.parse(assessedJobFit.choices[0]?.message.content || "{}");
}