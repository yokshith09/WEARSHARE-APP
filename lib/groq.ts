import Groq from "groq-sdk";

export const DEFAULT_GROQ_MODEL =
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

export function isGroqConfigured() {
  return Boolean(process.env.GROQ_API_KEY);
}

export async function generateGroqCompletion({
  messages,
  model = DEFAULT_GROQ_MODEL,
  temperature = 0.5,
  maxTokens = 800,
  jsonMode = false,
}: {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}) {
  const groq = getGroqClient();
  if (!groq) return null;

  const response = await groq.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
  });

  return response.choices[0]?.message?.content || null;
}

export async function createGroqStream({
  messages,
  model = DEFAULT_GROQ_MODEL,
  temperature = 0.6,
  maxTokens = 800,
}: {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const groq = getGroqClient();
  if (!groq) return null;

  return groq.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });
}
