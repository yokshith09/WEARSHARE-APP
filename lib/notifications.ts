import { sendEmail, wearShareEmailShell } from "@/lib/resend-email";

type BookingEmailInput = {
  to?: string | null;
  renterName?: string | null;
  listingName: string;
  rentalStart: string;
  rentalEnd: string;
  totalAmount: number;
};

export async function sendBookingConfirmationEmail(input: BookingEmailInput) {
  if (!input.to) {
    return { skipped: true };
  }

  return sendEmail(
    input.to,
    `WearShare booking confirmed: ${input.listingName}`,
    wearShareEmailShell(`
        <h1 style="font-size:22px">Your WearShare booking is confirmed</h1>
        <p>Hi ${input.renterName || "there"},</p>
        <p>Your booking for <strong>${input.listingName}</strong> is confirmed.</p>
        <p><strong>Rental:</strong> ${input.rentalStart} to ${input.rentalEnd}</p>
        <p><strong>Total paid:</strong> Rs ${input.totalAmount.toLocaleString("en-IN")}</p>
        <p>We will remind you one day before return.</p>
    `)
  );
}
