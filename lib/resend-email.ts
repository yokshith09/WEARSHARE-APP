import nodemailer from "nodemailer";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const smtpConfigured =
  Boolean(process.env.EMAIL_SMTP_HOST) &&
  Boolean(process.env.EMAIL_SMTP_USER) &&
  Boolean(process.env.EMAIL_SMTP_PASS);

function resolveFromAddress() {
  return (
    process.env.RESEND_FROM_EMAIL ||
    process.env.EMAIL_FROM_EMAIL ||
    "WearShare <noreply@wearshare.qzz.io>"
  );
}

function resolveSmtpFromAddress() {
  return (
    process.env.EMAIL_FROM_EMAIL ||
    (process.env.EMAIL_SMTP_USER ? `WearShare <${process.env.EMAIL_SMTP_USER}>` : resolveFromAddress())
  );
}

function getSmtpTransport() {
  if (!smtpConfigured) return null;

  return nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port: Number(process.env.EMAIL_SMTP_PORT || 587),
    secure: String(process.env.EMAIL_SMTP_SECURE || "").toLowerCase() === "true",
    auth: {
      user: process.env.EMAIL_SMTP_USER,
      pass: process.env.EMAIL_SMTP_PASS,
    },
  });
}

export function isEmailConfigured() {
  return Boolean(resend && process.env.RESEND_FROM_EMAIL) || smtpConfigured;
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (smtpConfigured) {
    const transport = getSmtpTransport();
    if (transport) {
      return transport.sendMail({
        from: resolveSmtpFromAddress(),
        to,
        subject,
        html,
      });
    }
  }

  if (resend && process.env.RESEND_FROM_EMAIL) {
    try {
      return await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to,
        subject,
        html,
      });
    } catch (error) {
      if (!smtpConfigured) throw error;
    }
  }

  return { skipped: true };
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
