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

  const body = await req.json().catch(() => ({}));
  const { message, sessionId = "default-session" } = body;

  if (!message || !sessionId) {
    return new Response(JSON.stringify({ error: "message + sessionId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const actorKey = userId ? `user:${userId}` : `session:${sessionId}`;
  const perMinuteLimit = Number(process.env.GEMINI_CHAT_PER_MINUTE_LIMIT || 60);
  const dailyLimit = Number(process.env.GEMINI_CHAT_DAILY_LIMIT || 500);

  try {
    await apiLimiter.check(perMinuteLimit, `chat-stream:${actorKey}`);
    await dailyLimiter.check(dailyLimit, `chat-stream-daily:${actorKey}`);
  } catch {
    // Return friendly stream response rather than 429 crash
    const rateMsg = "You're sending messages very quickly! Please wait a moment while I prepare your recommendations.";
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", data: rateMsg })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const useGroq = isGroqConfigured();
  const geminiModel = !useGroq ? getGeminiModel() : null;
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
        } else {
          // Intelligent assistant fallback when AI API keys are not supplied
          const fallbackReply = listings.length > 0
            ? `Here are top recommendations matching "${cleanMessage}" across Bengaluru. Each outfit includes refundable deposit protection, verified lender handover, and flexible booking dates. Browse the listings above or let me know if you'd like more details on sizing or pickup locations!`
            : `I'm here to help you find and rent designer ethnic and party wear across Bengaluru. You can ask for wedding lehengas, sherwanis, sarees, suits, sneakers, or blazers!`;

          fullResponse = fallbackReply;
          const words = fallbackReply.split(" ");
          for (const word of words) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "token", data: word + " " })}\n\n`)
            );
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        await saveChatMessage(sessionId, "assistant", fullResponse, userId);
      } catch (error: any) {
        console.error("[Chat Stream Error]", error);
        const fallbackMessage = listings.length > 0
          ? `Here are available outfits matching your search in Bengaluru. You can check sizes, rental rates, and deposit terms above!`
          : "I am ready to help you find outfits, compare prices, or explain how rental deposits work. What style or occasion are you looking for?";

        fullResponse = fallbackMessage;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "token", data: fallbackMessage })}\n\n`)
        );
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        await saveChatMessage(sessionId, "assistant", fullResponse, userId);
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

