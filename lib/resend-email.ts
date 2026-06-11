import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export function isEmailConfigured() {
  return Boolean(resend && process.env.RESEND_FROM_EMAIL);
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!resend || !process.env.RESEND_FROM_EMAIL) {
    return { skipped: true };
  }

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to,
    subject,
    html,
  });
}

export function wearShareEmailShell(content: string) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.55;color:#151512;background:#f8f5ef;padding:24px">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5ded2;padding:28px">
        <h1 style="font-family:Georgia,serif;font-size:28px;margin:0 0 16px;color:#151512">WearShare</h1>
        ${content}
        <p style="font-size:12px;color:#766f66;margin-top:28px">This email was sent by WearShare.</p>
      </div>
    </div>
  `;
}

