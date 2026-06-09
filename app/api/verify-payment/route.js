import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Razorpay secret is not configured." }, { status: 500 });
    }

    const generated = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const generatedBuffer = Buffer.from(generated, "hex");
    const signatureBuffer = Buffer.from(razorpay_signature, "hex");

    if (
      generatedBuffer.length !== signatureBuffer.length ||
      !crypto.timingSafeEqual(generatedBuffer, signatureBuffer)
    ) {
      return NextResponse.json({ error: "Signature mismatch." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
    });
  } catch (error) {
    console.error("[verify-payment] error:", error);
    return NextResponse.json({ error: "Unable to verify payment." }, { status: 500 });
  }
}
