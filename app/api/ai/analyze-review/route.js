import { NextResponse } from 'next/server';
import { generateGroqCompletion, isGroqConfigured } from '@/lib/groq';
import { extractJsonObject, getGeminiModel } from '@/lib/gemini';

export async function POST(request) {
  try {
    const { reviewText, orderId } = await request.json();

    if (!reviewText) {
      return NextResponse.json({ error: 'Review text is required' }, { status: 400 });
    }

    const prompt = `Analyze this peer-to-peer clothing rental review for sentiment and quality issues.
Return only JSON with the following structure:
{
  "sentiment": "positive" | "neutral" | "negative",
  "isFlagged": boolean,
  "flaggedIssues": string[],
  "summary": string,
  "action": "approve_review" | "flag_order"
}

Review text: "${reviewText}"`;

    if (isGroqConfigured()) {
      try {
        const rawJson = await generateGroqCompletion({
          messages: [
            { role: "system", content: "You are a moderation and sentiment analyzer for a peer-to-peer clothing rental marketplace. Output strictly valid JSON." },
            { role: "user", content: prompt }
          ],
          jsonMode: true,
          temperature: 0.2
        });

        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          return NextResponse.json({
            orderId,
            ...parsed,
            message: parsed.isFlagged
              ? 'Review flagged for manual moderation due to reported issues.'
              : 'Review approved.'
          });
        }
      } catch (groqErr) {
        console.error('[AI Analyze Review] Groq error:', groqErr);
      }
    }

    const geminiModel = getGeminiModel();
    if (geminiModel) {
      try {
        const result = await geminiModel.generateContent(prompt);
        const parsed = extractJsonObject(result.response.text());
        if (parsed) {
          return NextResponse.json({
            orderId,
            ...parsed,
            message: parsed.isFlagged
              ? 'Review flagged for manual moderation due to reported issues.'
              : 'Review approved.'
          });
        }
      } catch (geminiErr) {
        console.error('[AI Analyze Review] Gemini error:', geminiErr);
      }
    }

    // Rule-based fallback if no AI provider configured
    const lowercaseReview = reviewText.toLowerCase();
    const triggerWords = ['smell', 'torn', 'late', 'dirty', 'stain', 'damaged', 'poor', 'bad', 'fake'];
    const issues = triggerWords.filter((w) => lowercaseReview.includes(w));
    const isFlagged = issues.length > 0;

    return NextResponse.json({
      orderId,
      sentiment: isFlagged ? 'negative' : 'positive',
      isFlagged,
      flaggedIssues: issues,
      action: isFlagged ? 'flag_order' : 'approve_review',
      message: isFlagged
        ? 'Review flagged for manual moderation due to trigger words.'
        : 'Review approved.'
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

