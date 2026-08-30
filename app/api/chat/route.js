import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { getGeminiModel } from "@/lib/gemini"
import { generateGroqCompletion, isGroqConfigured } from "@/lib/groq"
import { apiLimiter, dailyLimiter } from "@/lib/rate-limit"
import {
  loadChatHistory,
  requiresListingSearch,
  retrieveRelevantListings,
  saveChatMessage,
  wearshareSystemPrompt,
} from "@/lib/rag"

export async function POST(request) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id || null
  const ip = request.headers.get("x-forwarded-for") || "unknown"

  try {
    const { message, sessionId = "default-session" } = await request.json()
    if (!message || String(message).trim().length < 2) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const actorKey = userId ? `user:${userId}` : `session:${sessionId}`
    const perMinuteLimit = Number(process.env.GEMINI_CHAT_PER_MINUTE_LIMIT || 60)
    const dailyLimit = Number(process.env.GEMINI_CHAT_DAILY_LIMIT || 500)

    try {
      await apiLimiter.check(perMinuteLimit, `chat:${actorKey}`)
      await dailyLimiter.check(dailyLimit, `chat-daily:${actorKey}`)
    } catch {
      return NextResponse.json({
        reply: "You're sending messages very quickly! Please wait a moment while I prepare your recommendations.",
        usedRAG: false,
        listings: [],
      })
    }

    const useGroq = isGroqConfigured()
    const geminiModel = !useGroq ? getGeminiModel() : null

    if (!useGroq && !geminiModel) {
      return NextResponse.json({
        reply: "Wren is not configured yet. Add GROQ_API_KEY or GEMINI_API_KEY to enable live replies, and you can still browse outfits while that is being set up.",
      })
    }

    const cleanMessage = String(message).slice(0, 1200)
    const [history, listings] = await Promise.all([
      loadChatHistory(sessionId),
      requiresListingSearch(cleanMessage) ? retrieveRelevantListings(cleanMessage, { matchCount: 5 }) : Promise.resolve([]),
    ])

    await saveChatMessage(sessionId, "user", cleanMessage, userId)

    let reply = ""

    if (useGroq) {
      const groqMessages = [
        { role: "system", content: wearshareSystemPrompt(listings) },
        ...history.map((h) => ({
          role: h.role === "model" ? "assistant" : "user",
          content: h.parts?.[0]?.text || "",
        })),
        { role: "user", content: cleanMessage },
      ]

      const groqReply = await generateGroqCompletion({ messages: groqMessages })
      reply = groqReply || ""
    } else if (geminiModel) {
      const chat = geminiModel.startChat({
        history: history.slice(-10),
        systemInstruction: {
          role: "user",
          parts: [{ text: wearshareSystemPrompt(listings) }],
        },
      })

      try {
        const result = await chat.sendMessage(cleanMessage)
        reply = result.response.text().trim()
      } catch (error) {
        console.warn("[Chat Gemini Warning]", error?.message);
      }
    }

    if (!reply) {
      reply = listings.length > 0
        ? `Here are recommended outfits matching your search in Bengaluru. Each item is verified with flexible dates and full deposit protection.`
        : `I'm here to help you discover premium designer wear across Bengaluru. Try asking for wedding lehengas, sarees, sherwanis, blazers, or sneakers!`;
    }

    await saveChatMessage(sessionId, "assistant", reply, userId)

    return NextResponse.json({
      reply,
      usedRAG: listings.length > 0,
      listings,
    })
  } catch (error) {
    console.error("[Chat Route Error]", error)
    return NextResponse.json({ error: "Unable to answer right now" }, { status: 500 })
  }
}

