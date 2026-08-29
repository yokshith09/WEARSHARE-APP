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
  const actorKey = userId ? `user:${userId}` : `ip:${ip}`
  const perMinuteLimit = Number(process.env.GEMINI_CHAT_PER_MINUTE_LIMIT || 10)
  const dailyLimit = Number(process.env.GEMINI_CHAT_DAILY_LIMIT || 100)

  try {
    await apiLimiter.check(perMinuteLimit, `chat:${actorKey}`)
    await dailyLimiter.check(dailyLimit, `chat-daily:${actorKey}`)
  } catch {
    return NextResponse.json({ error: "Chat limit reached. Please try again later." }, { status: 429 })
  }

  try {
    const { message, sessionId = "default-session" } = await request.json()
    if (!message || String(message).trim().length < 2) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
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
      reply = groqReply || "I am here to help you rent and list premium fashion across Bengaluru."
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
        const errMsg = String(error?.message || "").toLowerCase()
        if (errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("rate limit")) {
          return NextResponse.json({
            reply: "Wren is busy right now, so live AI replies are temporarily unavailable. Please try again in a minute, or browse outfits directly.",
            usedRAG: listings.length > 0,
            listings,
          })
        }
        throw error
      }
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

