/**
 * Prof G Email Sender
 * Sends the daily brief via Gmail SMTP.
 * Reuses the same pattern as Sarah's send-email.js with retry logic.
 */

const nodemailer = require('nodemailer');

// DASHBOARD_URL is replaced at runtime if the web app is running
const DASHBOARD_URL = process.env.BRIEFSTACK_URL || 'http://localhost:3001';

function buildFullHtml(subject, bodyHtml, topic, date, imageDataUri = null, unsubToken = null, firstName = '') {
  const imageBlock = imageDataUri
    ? `<img src="${imageDataUri}" alt="${topic.concept}" style="width:100%;border-radius:16px 16px 0 0;display:block;max-height:280px;object-fit:cover;">`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    @media(max-width:480px){
      .bs-outer{padding:16px 10px !important;}
      .bs-hero{padding:16px !important;}
      .bs-hero h1{font-size:17px !important;}
      .bs-body{padding:16px !important;}
      .bs-cta{padding:16px 14px !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#0f0f13;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div class="bs-outer" style="max-width:620px;margin:0 auto;padding:24px 14px;">

  <!-- Wordmark -->
  <div style="text-align:center;margin-bottom:16px;">
    <span style="font-size:13px;font-weight:800;letter-spacing:0.15em;color:#7c6af7;text-transform:uppercase;">BriefStack</span>
  </div>

  <!-- Hero card: image + header overlay -->
  <div style="border-radius:20px;overflow:hidden;margin-bottom:20px;position:relative;">
    ${imageBlock}
    <div class="bs-hero" style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:22px 24px;border-top:3px solid #7c6af7;">
      <p style="color:#a89ff5;font-size:11px;margin:0 0 8px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">${topic.course}</p>
      <h1 style="color:#ffffff;font-size:20px;margin:0 0 10px;font-weight:800;line-height:1.3;text-shadow:0 1px 3px rgba(0,0,0,0.5);"><span style="color:#ffffff;">${subject}</span></h1>
      <p style="color:#8b9ab5;font-size:12px;margin:0;">${date}</p>
    </div>
  </div>

  <!-- Body -->
  <div class="bs-body" style="background:white;border-radius:16px;padding:22px 24px;margin-bottom:20px;box-shadow:0 2px 12px rgba(0,0,0,0.15);line-height:1.75;font-size:15px;color:#1e293b;word-break:break-word;overflow-wrap:break-word;">
    ${firstName ? `<p style="font-size:15px;color:#475569;margin:0 0 16px 0;font-weight:600;">Hi ${firstName},</p>` : ''}
    ${bodyHtml}
  </div>

  <!-- Topic pill -->
  <div style="text-align:center;margin-bottom:20px;">
    <span style="font-size:12px;color:#7c6af7;background:#1e1b4b;padding:7px 18px;border-radius:20px;font-weight:600;">
      Today: ${topic.concept}
    </span>
  </div>

  <!-- Dashboard CTA -->
  <div class="bs-cta" style="background:#1e1b4b;border-radius:16px;padding:20px 24px;margin-bottom:20px;text-align:center;">
    <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0 0 10px;">Change style, swap source material, or reorder topics</p>
    <a href="${DASHBOARD_URL}/dashboard${unsubToken ? '?token=' + unsubToken : ''}" style="display:inline-block;background:#7c6af7;color:white;font-weight:700;font-size:13px;padding:10px 24px;border-radius:10px;text-decoration:none;">Open BriefStack Dashboard</a>
  </div>

  <!-- Tell a Friend -->
  <div style="background:#0f0f13;border:1px solid rgba(124,106,247,0.25);border-radius:16px;padding:20px 24px;margin-bottom:20px;text-align:center;">
    <p style="color:rgba(255,255,255,0.85);font-size:14px;font-weight:700;margin:0 0 4px;">Know someone who'd love this?</p>
    <p style="color:rgba(255,255,255,0.45);font-size:12px;margin:0 0 14px;">One brief a day. Personalised to their world.</p>
    <a href="${DASHBOARD_URL}" style="display:inline-block;background:transparent;color:#7c6af7;font-weight:700;font-size:13px;padding:9px 22px;border-radius:10px;text-decoration:none;border:1.5px solid #7c6af7;">Share BriefStack →</a>
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding:8px 0 16px;">
    <p style="font-size:11px;color:#64748b;margin:0 0 6px;">BriefStack · AI-generated content for educational purposes only</p>
    <p style="font-size:11px;color:#94a3b8;margin:0;">
      ${unsubToken ? `<a href="${DASHBOARD_URL}/unsubscribe?token=${unsubToken}" style="color:#94a3b8;">Unsubscribe</a> &nbsp;·&nbsp;` : ''}
      <a href="${DASHBOARD_URL}/terms" style="color:#94a3b8;">Terms</a> &nbsp;·&nbsp;
      <a href="${DASHBOARD_URL}/privacy" style="color:#94a3b8;">Privacy</a>
    </p>
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
