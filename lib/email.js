import { sendEmail, wearShareEmailShell, isEmailConfigured } from './resend-email';

export async function sendOTP(email, otp) {
  if (!isEmailConfigured()) {
    console.log(`[WearShare Dev Mode] Sending OTP ${otp} to ${email}`);
    return true;
  }

  const html = wearShareEmailShell(`
    <h2 style="color: #7c3aed; text-align: center; margin: 0 0 16px;">Welcome to WearShare ✨</h2>
    <p style="color: #475569; font-size: 16px; margin: 0 0 12px;">Here is your verification code to access your account:</p>
    <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
      <strong style="font-size: 32px; letter-spacing: 6px; color: #0f172a;">${otp}</strong>
    </div>
    <p style="color: #64748b; font-size: 14px; text-align: center;">This code will expire in 10 minutes. Do not share this code with anyone.</p>
  `);

  try {
    await sendEmail(email, 'Your WearShare Verification Code', html);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

