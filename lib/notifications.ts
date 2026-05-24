import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

type BookingEmailInput = {
  to?: string | null;
  renterName?: string | null;
  listingName: string;
  rentalStart: string;
  rentalEnd: string;
  totalAmount: number;
};

export async function sendBookingConfirmationEmail(input: BookingEmailInput) {
  if (!resend || !input.to || !process.env.RESEND_FROM_EMAIL) {
    return { skipped: true };
  }

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: input.to,
    subject: `WearShare booking confirmed: ${input.listingName}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.55;color:#151512">
        <h1 style="font-size:22px">Your WearShare booking is confirmed</h1>
        <p>Hi ${input.renterName || "there"},</p>
        <p>Your booking for <strong>${input.listingName}</strong> is confirmed.</p>
        <p><strong>Rental:</strong> ${input.rentalStart} to ${input.rentalEnd}</p>
        <p><strong>Total paid:</strong> Rs ${input.totalAmount.toLocaleString("en-IN")}</p>
        <p>We will remind you one day before return.</p>
      </div>
    `,
  });
}
