import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { reviewText, orderId } = await request.json()

    if (!reviewText) {
      return NextResponse.json({ error: 'Review text is required' }, { status: 400 })
    }

    // Simulate AI sentiment analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const lowercaseReview = reviewText.toLowerCase()
    const triggerWords = ['smell', 'torn', 'late', 'dirty', 'stain', 'damaged', 'poor', 'bad']
    
    let isFlagged = false
    let sentiment = 'positive'
    let issues = []

    for (const word of triggerWords) {
      if (lowercaseReview.includes(word)) {
        isFlagged = true
        sentiment = 'negative'
        issues.push(word)
      }
    }

    // Return the analysis result
    return NextResponse.json({
      orderId,
      sentiment,
      isFlagged,
      flaggedIssues: issues,
      action: isFlagged ? 'flag_order' : 'approve_review',
      message: isFlagged 
        ? 'Review flagged for manual moderation due to negative sentiment or trigger words.' 
        : 'Review approved.'
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
