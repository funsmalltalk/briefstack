/**
 * Prof G Email Sender
 * Sends the daily brief via Gmail SMTP.
 * Reuses the same pattern as Sarah's send-email.js with retry logic.
 */

const nodemailer = require('nodemailer');

// DASHBOARD_URL is replaced at runtime if the web app is running
const DASHBOARD_URL = process.env.BRIEFSTACK_URL || 'http://localhost:3001';

function buildFullHtml(subject, bodyHtml, topic, date, imageDataUri = null) {
  const imageBlock = imageDataUri
    ? `<img src="${imageDataUri}" alt="${topic.concept}" style="width:100%;border-radius:16px 16px 0 0;display:block;max-height:280px;object-fit:cover;">`
    : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f13;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:620px;margin:0 auto;padding:28px 16px;">

  <!-- Wordmark -->
  <div style="text-align:center;margin-bottom:16px;">
    <span style="font-size:13px;font-weight:800;letter-spacing:0.15em;color:#7c6af7;text-transform:uppercase;">BriefStack</span>
  </div>

  <!-- Hero card: image + header overlay -->
  <div style="border-radius:20px;overflow:hidden;margin-bottom:20px;position:relative;">
    ${imageBlock}
    <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:28px 32px;">
      <p style="color:rgba(255,255,255,0.45);font-size:11px;margin:0 0 6px;letter-spacing:0.1em;text-transform:uppercase;">${topic.course}</p>
      <h1 style="color:white;font-size:21px;margin:0 0 8px;font-weight:800;line-height:1.3;">${subject}</h1>
      <p style="color:rgba(255,255,255,0.45);font-size:12px;margin:0;">${date}</p>
    </div>
  </div>

  <!-- Body -->
  <div style="background:white;border-radius:16px;padding:28px 32px;margin-bottom:20px;box-shadow:0 2px 12px rgba(0,0,0,0.15);line-height:1.75;font-size:15px;color:#1e293b;">
    ${bodyHtml}
  </div>

  <!-- Topic pill -->
  <div style="text-align:center;margin-bottom:20px;">
    <span style="font-size:12px;color:#7c6af7;background:#1e1b4b;padding:7px 18px;border-radius:20px;font-weight:600;">
      Today: ${topic.concept}
    </span>
  </div>

  <!-- Dashboard CTA -->
  <div style="background:#1e1b4b;border-radius:16px;padding:20px 28px;margin-bottom:20px;text-align:center;">
    <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0 0 10px;">Change style, swap source material, or reorder topics</p>
    <a href="${DASHBOARD_URL}/dashboard" style="display:inline-block;background:#7c6af7;color:white;font-weight:700;font-size:13px;padding:10px 24px;border-radius:10px;text-decoration:none;">Open BriefStack Dashboard</a>
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding:8px 0 16px;">
    <p style="font-size:11px;color:#64748b;margin:0;">BriefStack - powered by your study materials and Claude</p>
  </div>

</div>
</body>
</html>`;
}

async function sendEmail(subject, bodyHtml, topic, imageDataUri = null) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    throw new Error('Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env');
  }

  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  const html = buildFullHtml(subject, bodyHtml, topic, date, imageDataUri);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass },
  });

  await transporter.sendMail({
    from: `"Prof G Daily" <${gmailUser}>`,
    to: gmailUser,
    subject: `[Prof G] ${subject}`,
    html,
  });

  return html;
}

async function sendWithRetry(subject, bodyHtml, topic, imageDataUri = null, attempts = 3, delayMs = 15000) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const html = await sendEmail(subject, bodyHtml, topic, imageDataUri);
      return html;
    } catch (err) {
      console.error(`Attempt ${i}/${attempts} failed: ${err.message}`);
      if (i < attempts) {
        console.log(`Retrying in ${delayMs / 1000}s...`);
        await new Promise(r => setTimeout(r, delayMs));
      } else {
        throw err;
      }
    }
  }
}

module.exports = { sendWithRetry, buildFullHtml };
