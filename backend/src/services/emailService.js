import nodemailer from 'nodemailer';

let transporter = null;

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: { user, pass }
    });
    return transporter;
  }
  return null;
}

function getOtpHtml({ name, otp }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexus OS - Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #111827; border: 1px solid #1f293d; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 36px 30px 20px 30px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.08) 100%);">
              <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; line-height: 48px; font-size: 24px; color: #ffffff; text-align: center; font-weight: bold; margin-bottom: 12px;">
                ✦
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Nexus OS</h1>
              <p style="margin: 6px 0 0 0; font-size: 14px; color: #94a3b8;">AI-Powered Productivity System</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 36px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #f1f5f9;">Email Verification</h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                Hello <strong style="color: #e2e8f0;">${name || 'there'}</strong>,<br/>
                Thank you for choosing Nexus OS. Please use the 6-digit verification code below to verify your email address and activate your account.
              </p>
              
              <!-- OTP Box -->
              <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 22px; text-align: center; margin: 24px 0;">
                <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #818cf8; margin-bottom: 8px;">
                  Verification Code (OTP)
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ffffff; margin-left: 8px;">
                  ${otp}
                </div>
                <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
                  Expires in 10 minutes
                </div>
              </div>

              <p style="margin: 20px 0 0 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                If you didn't attempt to sign up for Nexus OS, you can safely ignore this message. Your email address remains secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #0b0f19; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                &copy; ${new Date().getFullYear()} Nexus OS Productivity Suite. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOtpEmail({ to, name, otp }) {
  const mailer = getTransporter();
  const subject = `Your Nexus OS Verification Code: ${otp}`;
  const html = getOtpHtml({ name, otp });

  if (mailer) {
    try {
      const from = process.env.EMAIL_FROM || `"Nexus OS" <${process.env.SMTP_USER}>`;
      const info = await mailer.sendMail({
        from,
        to,
        subject,
        html,
        text: `Hello ${name || 'there'},\n\nYour Nexus OS verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nNexus OS Team`
      });
      console.log(`[Email Service] Sent OTP email to ${to}: ${info.messageId}`);
      return { success: true, delivered: true };
    } catch (err) {
      console.error('[Email Service] Failed to send email via SMTP:', err.message);
    }
  }

  // Fallback dev console output
  console.log(`\n======================================================`);
  console.log(`📧 [EMAIL SERVICE - OTP NOTIFICATION]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Verification Code (OTP): >>> ${otp} <<<`);
  console.log(`Expires in: 10 minutes`);
  console.log(`Note: Configure SMTP_HOST, SMTP_USER, SMTP_PASS in backend/.env for real delivery.`);
  console.log(`======================================================\n`);

  return { success: true, delivered: false, devOtp: otp };
}

