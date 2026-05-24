import { NextResponse } from "next/server"
import { getGeminiModel } from "@/lib/gemini"
import { apiLimiter } from "@/lib/rate-limit"
import {
  loadChatHistory,
  requiresListingSearch,
  retrieveRelevantListings,
  saveChatMessage,
  wearshareSystemPrompt,
} from "@/lib/rag"

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    await apiLimiter.check(20, `chat:${ip}`)
  } catch {
    return NextResponse.json({ error: "Too many chat messages. Please try again later." }, { status: 429 })
  }

  try {
    const { message, sessionId = "default-session", userId } = await request.json()
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
