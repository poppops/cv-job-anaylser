import OpenAI from "openai";

export const embedText = async (text: string) => {
    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || ""
    });

    if (!client) {
        throw new Error("OpenAI client not initialized");
    }

    const embedding = await client.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        dimensions: 512,
    });

    return embedding.data[0]?.embedding;
}