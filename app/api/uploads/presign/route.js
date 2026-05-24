import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { createListingPhotoUploadUrl } from "@/lib/r2"
import { apiLimiter } from "@/lib/rate-limit"

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    await apiLimiter.check(30, `upload:${session.user.id}`)
  } catch {
    return NextResponse.json({ error: "Too many upload requests." }, { status: 429 })
  }

  try {
    const { files } = await request.json()
    if (!Array.isArray(files) || files.length === 0 || files.length > 6) {
      return NextResponse.json({ error: "Upload between 1 and 6 photos." }, { status: 400 })
    }

    const urls = []
    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.contentType)) {
        return NextResponse.json({ error: "Only JPG, PNG, or WebP photos are allowed." }, { status: 400 })
      }

      const signed = await createListingPhotoUploadUrl({
        userId: session.user.id,
        fileName: file.name || "listing-photo.jpg",
        contentType: file.contentType,
      })

      if (!signed) {
        return NextResponse.json({ error: "Cloudflare R2 is not configured." }, { status: 503 })
      }

      urls.push(signed)
    }

    return NextResponse.json({ uploads: urls })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to create upload URLs" }, { status: 500 })
  }
}
