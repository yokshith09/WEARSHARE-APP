import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getGeminiModel } from "@/lib/gemini";
import { createGroqStream, isGroqConfigured } from "@/lib/groq";
import { apiLimiter, dailyLimiter } from "@/lib/rate-limit";
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
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || null;
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const actorKey = userId ? `user:${userId}` : `ip:${ip}`;
  const perMinuteLimit = Number(process.env.GEMINI_CHAT_PER_MINUTE_LIMIT || 10);
  const dailyLimit = Number(process.env.GEMINI_CHAT_DAILY_LIMIT || 100);

  try {
    await apiLimiter.check(perMinuteLimit, `chat-stream:${actorKey}`);
    await dailyLimiter.check(dailyLimit, `chat-stream-daily:${actorKey}`);
  } catch {
    return new Response(JSON.stringify({ error: "Chat limit reached. Please try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { message, sessionId = "default-session" } = await req.json();
  if (!message || !sessionId) {
    return new Response(JSON.stringify({ error: "message + sessionId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const useGroq = isGroqConfigured();
  const geminiModel = !useGroq ? getGeminiModel() : null;

  if (!useGroq && !geminiModel) {
    return new Response(
      JSON.stringify({
        error: "Wren is not configured yet. Add GROQ_API_KEY or GEMINI_API_KEY to enable live replies.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
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

      if (listings.length) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "listings", data: listings })}\n\n`)
        );
      }

      try {
        if (useGroq) {
          // Format messages for Groq API (OpenAI compatible)
          const groqMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
            { role: "system", content: wearshareSystemPrompt(listings) },
            ...history.map((h: any) => ({
              role: (h.role === "model" ? "assistant" : "user") as "assistant" | "user",
              content: h.parts?.[0]?.text || "",
            })),
            { role: "user", content: cleanMessage },
          ];

          const groqStream = await createGroqStream({
            messages: groqMessages,
          });

          if (groqStream) {
            for await (const chunk of groqStream) {
              const delta = chunk.choices[0]?.delta?.content || "";
              if (!delta) continue;
              fullResponse += delta;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "token", data: delta })}\n\n`)
              );
            }
          }
        } else if (geminiModel) {
          const chat = geminiModel.startChat({
            history: history.slice(-10),
            systemInstruction: {
              role: "user",
              parts: [{ text: wearshareSystemPrompt(listings) }],
            },
          });

          const streamResult = await chat.sendMessageStream(cleanMessage);

          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            if (!text) continue;
            fullResponse += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "token", data: text })}\n\n`)
            );
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        await saveChatMessage(sessionId, "assistant", fullResponse, userId);
      } catch (error: any) {
        console.error("[Chat Stream Error]", error);
        const errText =
          String(error?.message || "").toLowerCase().includes("503") ||
          String(error?.message || "").toLowerCase().includes("rate limit")
            ? "Wren is busy right now. Please try again in a minute."
            : error?.message || "Unable to stream reply";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              data: errText,
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

