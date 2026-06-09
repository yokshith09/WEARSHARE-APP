import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { getGeminiModel } from "@/lib/gemini"
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
  const actorKey = userId ? `user:${userId}` : `ip:${ip}`
  const perMinuteLimit = Number(process.env.GEMINI_CHAT_PER_MINUTE_LIMIT || 10)
  const dailyLimit = Number(process.env.GEMINI_CHAT_DAILY_LIMIT || 100)

  try {
    await apiLimiter.check(perMinuteLimit, `chat:${actorKey}`)
    await dailyLimiter.check(dailyLimit, `gemini-chat:${actorKey}`)
  } catch {
    return NextResponse.json({ error: "Chat limit reached. Please try again later." }, { status: 429 })
  }

  try {
    const { message, sessionId = "default-session" } = await request.json()
    if (!message || String(message).trim().length < 2) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const model = getGeminiModel()
    if (!model) {
      return NextResponse.json({
        reply: "I can help with rentals, deposits, returns, and sizing once Gemini is configured. Add GEMINI_API_KEY to enable live answers.",
      })
    }

    const cleanMessage = String(message).slice(0, 1200)
    const [history, listings] = await Promise.all([
      loadChatHistory(sessionId),
      requiresListingSearch(cleanMessage) ? retrieveRelevantListings(cleanMessage, { matchCount: 5 }) : Promise.resolve([]),
    ])

    await saveChatMessage(sessionId, "user", cleanMessage, userId)

    const chat = model.startChat({
      history: history.slice(-10),
      systemInstruction: {
        role: "user",
        parts: [{ text: wearshareSystemPrompt(listings) }],
      },
    })

    const result = await chat.sendMessage(cleanMessage)
    const reply = result.response.text().trim()

    await saveChatMessage(sessionId, "assistant", reply, userId)

    return NextResponse.json({
      reply,
      usedRAG: listings.length > 0,
      listings,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to answer right now" }, { status: 500 })
  }
}
