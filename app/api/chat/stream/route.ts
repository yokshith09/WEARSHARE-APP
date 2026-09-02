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
  const perMinuteLimit = Number(process.env.GEMINI_CHAT_PER_MINUTE_LIMIT || 120);

  try {
    await apiLimiter.check(perMinuteLimit, `chat-stream:${actorKey}`);
  } catch (limiterErr) {
    console.warn("[Chat Stream Rate Limit]", limiterErr);
    // Continue gracefully rather than hard-blocking legitimate chat interactions
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
          const lower = cleanMessage.toLowerCase().trim();
          let fallbackReply = "";
          if (listings.length > 0) {
            fallbackReply = `Here are top recommendations matching your search across Bengaluru and Coimbatore. Every booking includes 100% refundable security deposit protection, verified lender handover, and flexible pickup dates. Tap any listing above to view details, or ask me about sizing and fit!`;
          } else if (lower === "hi" || lower === "hello" || lower === "hey" || lower.startsWith("hi ") || lower.startsWith("hello ")) {
            fallbackReply = "Hey! I'm Wren, your WearShare styling assistant. I can help you find wedding lehengas, sarees, royal sherwanis, party gowns, blazers, and luxury accessories across Bengaluru and Coimbatore. What occasion or style are you shopping for today?";
          } else if (lower.includes("deposit") || lower.includes("refund") || lower.includes("return")) {
            fallbackReply = "On WearShare, security deposits are 100% refundable once the outfit is safely returned after your rental period. All listings are verified and protected against minor accidental wear.";
          } else {
            fallbackReply = `I'm here to help you find and rent designer ethnic and party wear across Bengaluru and Coimbatore. Ask me about wedding lehengas, sherwanis, sarees, suits, sneakers, or blazers!`;
          }

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
        const lower = cleanMessage.toLowerCase().trim();
        let fallbackMessage = "";
        if (listings.length > 0) {
          fallbackMessage = `Here are available outfits matching your search. You can check sizes, rental rates, and deposit terms above!`;
        } else if (lower === "hi" || lower === "hello" || lower === "hey" || lower.startsWith("hi ") || lower.startsWith("hello ")) {
          fallbackMessage = "Hey! I'm Wren, your WearShare styling assistant. What occasion or outfit are you looking for today?";
        } else {
          fallbackMessage = "I'm here to help you find outfits, compare prices, or explain rental deposits. What style are you looking for?";
        }

        fullResponse = fallbackMessage;
        const words = fallbackMessage.split(" ");
        for (const word of words) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "token", data: word + " " })}\n\n`)
          );
        }
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

