import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { supabaseAdmin } from "@/lib/supabase"
import { sendBookingConfirmationEmail } from "@/lib/notifications"

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { bookingId } = await request.json()
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select("*, listings(title), renter:users!renter_id(name,email)")
      .eq("id", bookingId)
      .single()

    if (error || !booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    if (booking.renter_id !== session.user.id && booking.lender_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await sendBookingConfirmationEmail({
      to: booking.renter?.email,
      renterName: booking.renter?.name,
      listingName: booking.listings?.title || "your outfit",
      rentalStart: booking.rental_start,
      rentalEnd: booking.rental_end,
      totalAmount: Number(booking.total_amount || 0),
    })

    await supabaseAdmin.from("bookings").update({ notification_status: "sent" }).eq("id", bookingId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to send notification" }, { status: 500 })
  }
}
