const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function sendOtpEmail(to, code, purpose) {
  const purposeText = {
    signup: 'complete your signup',
    signin: 'sign in',
    'forgot-password': 'reset your password',
    'change-password': 'change your password',
  }[purpose] || 'verify your request';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#2563eb;">Finance Tracker</h2>
      <p>Use the OTP below to ${purposeText}. This code expires in
      ${process.env.OTP_EXPIRES_MIN || 10} minutes.</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; background:#f1f5f9; padding: 16px; text-align:center; border-radius: 8px;">
        ${code}
      </div>
      <p style="color:#64748b; font-size: 13px; margin-top: 16px;">
        If you did not request this, please ignore this email.
      </p>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject: `Your OTP code: ${code}`,
      html,
    });
  } catch (err) {
    // In dev, if SMTP isn't configured, log the OTP instead of crashing
    console.warn('Email send failed, logging OTP instead:', err.message);
    console.log(`[DEV OTP] To: ${to} | Purpose: ${purpose} | Code: ${code}`);
  }
}

module.exports = { sendOtpEmail };
