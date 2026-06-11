import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_MODEL =
  process.env.GEMINI_MODEL && !process.env.GEMINI_MODEL.startsWith("gemini-1.5")
    ? process.env.GEMINI_MODEL
    : "gemini-2.5-flash";
const EMBEDDING_MODEL = "text-embedding-004";

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

export function getGeminiModel(model = DEFAULT_MODEL) {
  const client = getGeminiClient();
  if (!client) return null;
  return client.getGenerativeModel({
    model,
    generationConfig: {
      maxOutputTokens: Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 500),
    },
  });
}

export async function embedText(text: string) {
  const client = getGeminiClient();
  if (!client) throw new Error("GEMINI_API_KEY is not configured");
  const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export function extractJsonObject(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced?.[1] || text;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(source.slice(start, end + 1));
  } catch {
    return null;
  }
}
