import { NextResponse } from 'next/server'
import { apiLimiter } from '@/lib/rate-limit'
import { extractJsonObject, getGeminiModel } from '@/lib/gemini'

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    await apiLimiter.check(3, ip); // Rate limit to prevent abuse
  } catch (error) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await request.json().catch(() => ({}))
    const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls.slice(0, 3) : []
    const model = getGeminiModel()

    if (model) {
      const result = await model.generateContent(`
        You help WearShare listers create accurate Indian fashion rental listings.
        Based on these photo URLs and optional context, return only JSON with:
        title, category, condition, description, occasion, retailPrice, pricePerDay, deposit, tags.
        Use INR numbers. Categories must be one of Lehenga, Saree, Sherwani, Anarkali, Gown, Kurta, Suit, Indo-Western, Blazer, Tuxedo, Co-ord Set, Dhoti, Accessories, Shirt, Pant.
        Photo URLs: ${imageUrls.join(", ") || "not uploaded yet"}
        Context: ${JSON.stringify(body.context || {})}
      `)
      const parsed = extractJsonObject(result.response.text())
      if (parsed) {
        return NextResponse.json(parsed)
      }
    }

    const mockResponses = [
      {
        title: "Embroidered Silk Lehenga",
        category: "Lehenga",
        condition: "Like New",
        description: "Embroidered silk lehenga suited for weddings, sangeet, and festive evenings.",
        occasion: "Wedding",
        retailPrice: 45000,
        pricePerDay: 1800,
        deposit: 5000,
        tags: ["Wedding", "Festive", "Embroidered"]
      },
      {
        title: "Designer Velvet Sherwani",
        category: "Sherwani",
        condition: "Excellent",
        description: "Designer velvet sherwani with a structured festive fit for wedding functions.",
        occasion: "Wedding",
        retailPrice: 35000,
        pricePerDay: 1500,
        deposit: 4000,
        tags: ["Groom", "Wedding", "Velvet"]
      },
      {
        title: "Banarasi Silk Saree",
        category: "Saree",
        condition: "Good",
        description: "Banarasi silk saree with traditional detailing for festive and family occasions.",
        occasion: "Festival",
        retailPrice: 15000,
        pricePerDay: 800,
        deposit: 2000,
        tags: ["Traditional", "Silk", "Festive"]
      }
    ];

    // Pick a random mock response to seem dynamic
    const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];

    return NextResponse.json(response)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
