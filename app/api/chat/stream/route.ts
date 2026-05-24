import { NextRequest } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { apiLimiter } from "@/lib/rate-limit";
import {
  loadChatHistory,
  requiresListingSearch,
  retrieveRelevantListings,
  saveChatMessage,
  wearshareSystemPrompt,
} from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    await apiLimiter.check(20, `chat-stream:${ip}`);
  } catch {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { message, sessionId = "default-session", userId } = await req.json();
  if (!message || !sessionId) {
    return new Response(JSON.stringify({ error: "message + sessionId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const model = getGeminiModel();
  if (!model) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cleanMessage = String(message).slice(0, 1200);
  const [history, listings] = await Promise.all([
    loadChatHistory(sessionId),
    requiresListingSearch(cleanMessage)
      ? retrieveRelevantListings(cleanMessage, { matchCount: 5 })
      : Promise.resolve([]),
  ]);

  await saveChatMessage(sessionId, "user", cleanMessage, userId);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let fullResponse = "";

      try {
        const chat = model.startChat({
          history: history.slice(-10),
          systemInstruction: {
            role: "user",
            parts: [{ text: wearshareSystemPrompt(listings) }],
          },
        });

        const streamResult = await chat.sendMessageStream(cleanMessage);

        if (listings.length) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "listings", data: listings })}\n\n`)
          );
        }

        for await (const chunk of streamResult.stream) {
          const text = chunk.text();
          if (!text) continue;
          fullResponse += text;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "token", data: text })}\n\n`)
          );
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        await saveChatMessage(sessionId, "assistant", fullResponse, userId);
      } catch (error: any) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              data: error?.message || "Unable to stream reply",
            })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

