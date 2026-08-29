import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized. Please login to use AI Try-On.' }, { status: 401 });

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: 'Virtual Try-On is not configured. REPLICATE_API_TOKEN is required.' }, { status: 503 });
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const { personImage, garmentImage, category = 'Upper-body' } = await req.json();

    if (!personImage || !garmentImage) {
      return NextResponse.json({ error: 'Both person and garment images are required' }, { status: 400 });
    }

    console.log('[AI Try-On] Starting Replicate prediction...');

    // Using the IDM-VTON model on Replicate
    // Model ID: cuuupid/idm-vton
    const output = await replicate.run(
      "cuuupid/idm-vton:0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
      {
        input: {
          garm_img: garmentImage,
          human_img: personImage,
          garment_des: "clothing",
          custom_clothing: false
        }
      }
    );

    console.log('[AI Try-On] Prediction successful');

    // Output is generally an array of image URLs [ "https://replicate.delivery/..." ]
    return NextResponse.json({
      success: true,
      resultImage: Array.isArray(output) ? output[0] : output
    });

  } catch (error) {
    console.error('[AI Try-On] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate try-on image' }, { status: 500 });
  }
}
