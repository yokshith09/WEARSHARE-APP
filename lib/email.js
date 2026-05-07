import nodemailer from 'nodemailer'

export async function sendOTP(email, otp) {
  // Use a generic test account if EMAIL_USER is not provided
  console.log(`[Email Debug] Attempting to send to ${email} using ${process.env.EMAIL_USER?.substring(0, 3)}...`);

  let transporter;
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    console.log(`[WearShare Dev Mode] Sending OTP ${otp} to ${email}`);
    return true; // Simulate success in dev mode without real credentials
  }

  const mailOptions = {
    from: `"WearShare" <${process.env.EMAIL_USER || 'noreply@wearshare.app'}>`,
    to: email,
    subject: 'Your WearShare Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #7c3aed; text-align: center;">Welcome to WearShare ✨</h2>
        <p style="color: #475569; font-size: 16px;">Here is your verification code to access your account:</p>
        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <strong style="font-size: 28px; letter-spacing: 4px; color: #0f172a;">${otp}</strong>
        </div>
        <p style="color: #64748b; font-size: 14px; text-align: center;">This code will expire in 10 minutes. Do not share this code with anyone.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">If you didn't request this, please ignore this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}
