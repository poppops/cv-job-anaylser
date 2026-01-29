import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { readFile } from "fs/promises";
import { Document } from "langchain";
import PdfParse from "pdf-parse";
import openai from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { cvSchema } from "../models/CV";

export const loadDocuments = async (file: Express.Multer.File) => {
    let loader;
    let documents: Document[];

    if (file.mimetype === "application/pdf") {
        // Use pdf-parse directly due to ESM import issues with PDFLoader
        const pdfBuffer = await readFile(file.path);
        const pdfData = await PdfParse(pdfBuffer);
        // Create Document manually
        documents = [new Document({
            pageContent: pdfData.text,
            metadata: {
                source: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                ...pdfData.info,
            },
        })];
    } else if (
        file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
        loader = new DocxLoader(file.path);
        documents = await loader.load();
    } else if (file.mimetype.startsWith("text/")) {
        loader = new TextLoader(file.path);
        documents = await loader.load();
    } else {
        throw new Error(`Unsupported file type: ${file.mimetype}. Please upload a PDF, DOCX, or text file.`);
    }

    return documents;

}

export const parseCV = async (cvText: string) => {
    const client = new openai({
        apiKey: process.env.OPENAI_KEY || ""
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