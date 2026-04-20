/**
 * BriefStack Web Server
 * Express app with magic-link auth, dashboard, and per-user email cron.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const cron = require('node-cron');
const multer = require('multer');

const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const db = require('./db');
const { pickTopic, generateEmailContent, generateImage, extractTextFromBuffer, PERSONAS } = require('./engine');
const { buildFullHtml } = require('../send');

const app = express();
const PORT = process.env.PORT || 3001;
const BASE_URL = process.env.BRIEFSTACK_URL || `http://localhost:${PORT}`;

// Simple in-memory rate limiter for auth endpoint
const authRateLimits = new Map(); // email -> { count, resetAt }
function checkRateLimit(email) {
  const now = Date.now();
  const limit = authRateLimits.get(email);
  if (limit && now < limit.resetAt) {
    if (limit.count >= 3) return false;
    limit.count++;
  } else {
    authRateLimits.set(email, { count: 1, resetAt: now + 10 * 60 * 1000 });
  }
  return true;
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// File uploads: store in memory for parsing
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// Session lookup — token is set as a 30-day cookie on verify, sessions persist
// We look up the magic link record but do NOT enforce expiry (it's a session token at this point)
function getSession(req) {
  const token = req.headers['x-session-token'] || req.query.token || (req.headers.cookie || '').match(/bs_token=([^;]+)/)?.[1];
  if (!token) return null;
  // Find by token regardless of expiry/used status (it's being used as a persistent session)
  const link = db.getMagicLinkByToken(token);
  if (!link) return null;
  return db.getUserById(link.user_id);
}

function requireAuth(req, res, next) {
  const user = getSession(req);
  if (!user) return res.redirect('/');
  req.user = user;
  next();
}

// --- Email sending ---
const FROM_NAME = 'BriefStack';

async function sendBrevoEmail(to, subject, html) {
  // Try Brevo first if credentials are available
  const brevoKey = process.env.BREVO_API_KEY;
  const brevoFrom = process.env.BREVO_FROM_EMAIL;
  if (brevoKey && brevoFrom) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: brevoFrom },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Brevo error: ${JSON.stringify(data)}`);
    return data;
  }

  // Fall back to Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const resend = new Resend(resendKey);
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'briefs@briefstack.app';
    const { error } = await resend.emails.send({ from: `${FROM_NAME} <${fromEmail}>`, to, subject, html });
    if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
    return { via: 'resend' };
  }

  // Fall back to Gmail via Nodemailer
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (gmailUser && gmailPass) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${gmailUser}>`,
      to,
      subject,
      html,
    });
    return { via: 'gmail' };
  }

  throw new Error('No email credentials configured. Set BREVO_API_KEY, RESEND_API_KEY, or GMAIL_USER + GMAIL_APP_PASSWORD.');
}

async function sendMagicLink(email, link) {
  await sendBrevoEmail(email, 'Your BriefStack login link', `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f0f13;border-radius:16px;color:white;">
      <h2 style="color:#7c6af7;margin:0 0 16px;">BriefStack</h2>
      <p style="color:rgba(255,255,255,0.8);margin:0 0 24px;">Click the button below to sign in. Link expires in 1 hour.</p>
      <a href="${link}" style="display:inline-block;background:#7c6af7;color:white;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:15px;">Sign In to BriefStack</a>
      <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:24px 0 0;">If you didn't request this, ignore this email.</p>
    </div>
  `);
}

// --- Routes ---

// Landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Legal pages
app.get('/terms', (req, res) => res.sendFile(path.join(__dirname, 'public', 'terms.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'privacy.html')));

// Unsubscribe
app.get('/unsubscribe', (req, res) => {
  const { token } = req.query;
  if (token) {
    const link = db.getMagicLinkByToken(token);
    if (link) {
      db.saveSettings(link.user_id, { active: 0 });
      return res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#f9fafb"><h2>Unsubscribed</h2><p>You've been unsubscribed from BriefStack daily emails. <a href="/">Return to homepage</a>.</p></body></html>`);
    }
  }
  res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#f9fafb"><h2>Link invalid</h2><p>This unsubscribe link has expired. <a href="/">Go to your dashboard</a> to manage settings.</p></body></html>`);
});

// Admin leads page (protected by env var password)
app.get('/admin', (req, res) => {
  const adminKey = process.env.ADMIN_KEY || 'briefstack-admin';
  if (req.query.key !== adminKey) return res.status(401).send('Unauthorized');
  const users = db.getDb().prepare(`
    SELECT u.id, u.email, u.created_at, u.onboarded, u.trial_ends,
           s.persona, s.send_days, s.active, s.topic_source,
           (SELECT COUNT(*) FROM sent_emails WHERE user_id = u.id) as emails_sent
    FROM users u LEFT JOIN settings s ON s.user_id = u.id
    ORDER BY u.created_at DESC
  `).all();
  const rows = users.map(u => `
    <tr>
      <td>${u.email}</td>
      <td>${(u.created_at || '').split('T')[0]}</td>
      <td>${u.onboarded ? '✅' : '⏳'}</td>
      <td>${u.active ? '🟢' : '⏸️'}</td>
      <td>${u.persona || '-'}</td>
      <td>${u.send_days || 'daily'}</td>
      <td>${u.emails_sent || 0}</td>
      <td>${u.trial_ends ? (u.trial_ends || '').split('T')[0] : '-'}</td>
    </tr>`).join('');
  res.send(`<!DOCTYPE html><html><head><title>BriefStack Admin</title>
    <style>body{font-family:sans-serif;padding:32px;background:#f9fafb}h1{color:#4f46e5}table{border-collapse:collapse;width:100%}th,td{border:1px solid #e5e7eb;padding:8px 12px;text-align:left}th{background:#f3f4f6;font-size:12px;text-transform:uppercase}tr:hover{background:#f9fafb}a{color:#4f46e5}</style>
    </head><body>
    <h1>BriefStack Leads</h1>
    <p style="color:#6b7280">${users.length} signups total</p>
    <table><thead><tr><th>Email</th><th>Signed Up</th><th>Onboarded</th><th>Active</th><th>Persona</th><th>Frequency</th><th>Emails Sent</th><th>Trial Ends</th></tr></thead>
    <tbody>${rows}</tbody></table>
    </body></html>`);
});

// Magic link request
app.post('/api/auth/request', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' });

  const normalizedEmail = email.trim().toLowerCase();
  if (!checkRateLimit(normalizedEmail)) {
    return res.status(429).json({ error: 'Too many requests. Try again in 10 minutes.' });
  }

  const user = db.findOrCreateUser(normalizedEmail);
  // Set 7-day trial for new users
  if (!user.trial_ends) {
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    db.setTrialEnds(user.id, trialEnd);
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  db.createMagicLink(user.id, token, expires);

  const link = `${BASE_URL}/auth/verify?token=${token}`;

  try {
    await sendMagicLink(email, link);
    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to send magic link:', e.message);
    res.status(500).json({ error: 'Failed to send email. Check server config.' });
  }
});

// Magic link verification
app.get('/auth/verify', (req, res) => {
  const { token } = req.query;
  if (!token) return res.redirect('/?error=invalid');

  const link = db.getMagicLink(token);
  if (!link || new Date(link.expires_at) < new Date()) {
    return res.redirect('/?error=expired');
  }

  db.updateLastLogin(link.user_id);
  // Token stays valid (not consumed) so user can use it as a persistent session cookie
  // Redirect to dashboard with token in cookie
  res.setHeader('Set-Cookie', `bs_token=${token}; Path=/; HttpOnly; Max-Age=2592000`);
  res.redirect('/dashboard');
});

// Dashboard page
app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// --- API ---

// Get current user + settings
app.get('/api/me', requireAuth, (req, res) => {
  const user = db.getUserById(req.user.id); // re-fetch for latest onboarded flag
  const settings = db.getSettings(req.user.id);
  const uploads = db.getUploads(req.user.id);
  const customTopics = db.getCustomTopics(req.user.id);
  const history = db.getSentEmails(req.user.id, 30);
  res.json({ user: { email: user.email, onboarded: user.onboarded || 0, trial_ends: user.trial_ends, first_name: user.first_name || '' }, settings, uploads, customTopics, history });
});

// Convert local hour to UTC hour using timezone string
function localHourToUtc(localHour, timezone) {
  try {
    const now = new Date();
    const localStr = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }).format(now);
    const utcStr = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', hour: 'numeric', hour12: false }).format(now);
    const offsetHours = (parseInt(utcStr) - parseInt(localStr) + 24) % 24;
    return (localHour + offsetHours) % 24;
  } catch (e) {
    return localHour; // fallback if timezone invalid
  }
}

// Complete onboarding: save settings, mark onboarded, fire first email
app.post('/api/onboard', requireAuth, async (req, res) => {
  const { context_text, persona, send_hour, timezone, first_name, topic_source } = req.body;
  const tz = timezone || 'America/Chicago';
  const localHour = parseInt(send_hour) || 8;
  if (first_name) db.setFirstName(req.user.id, first_name.trim());
  db.saveSettings(req.user.id, {
    context_text: context_text || '',
    persona: persona || 'galloway',
    send_hour: localHour,
    send_hour_utc: localHourToUtc(localHour, tz),
    timezone: tz,
    topic_source: topic_source || 'internet',
    active: 1,
  });
  db.setOnboarded(req.user.id);
  res.json({ ok: true });
  // Fire first email asynchronously after response is sent
  sendEmailForUser(req.user.id, req.user.email).catch(e => console.error('[Onboard] First email failed:', e.message));
});

// Save settings
app.post('/api/settings', requireAuth, (req, res) => {
  const { persona, persona_custom, context_text, topic_source, send_hour, send_days, timezone, active, first_name } = req.body;
  if (first_name !== undefined) db.setFirstName(req.user.id, first_name.trim());
  const tz = timezone || 'America/Chicago';
  const localHour = parseInt(send_hour) || 8;
  db.saveSettings(req.user.id, { persona, persona_custom, context_text, topic_source,
    send_hour: localHour, send_hour_utc: localHourToUtc(localHour, tz),
    send_days: send_days || 'daily', timezone: tz,
    active: active !== undefined ? (active ? 1 : 0) : undefined });
  res.json({ ok: true });
});

// Upload PDF(s) — accepts single file or multiple files (including folder contents)
app.post('/api/upload', requireAuth, upload.array('files', 50), async (req, res) => {
  const files = req.files && req.files.length ? req.files : (req.file ? [req.file] : []);
  if (!files.length) return res.status(400).json({ error: 'No file' });
  const results = [];
  for (const f of files) {
    let parsedText = null;
    try { parsedText = await extractTextFromBuffer(f.buffer, f.originalname); } catch (e) {}
    const filename = `${Date.now()}-${f.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    db.saveUpload(req.user.id, filename, f.originalname, parsedText);
    results.push({ name: f.originalname, chars: parsedText ? parsedText.length : 0 });
  }
  res.json({ ok: true, files: results });
});

// Delete upload
app.delete('/api/upload/:id', requireAuth, (req, res) => {
  db.deleteUpload(parseInt(req.params.id), req.user.id);
  res.json({ ok: true });
});

// Add custom topic
app.post('/api/topics', requireAuth, (req, res) => {
  const { course, concept, search_hint, context_angle } = req.body;
  if (!course || !concept) return res.status(400).json({ error: 'course and concept required' });
  db.addCustomTopic(req.user.id, course, concept, search_hint, context_angle);
  res.json({ ok: true });
});

// Delete custom topic
app.delete('/api/topics/:id', requireAuth, (req, res) => {
  db.deleteCustomTopic(parseInt(req.params.id), req.user.id);
  res.json({ ok: true });
});

// Preview a specific email (generate + return HTML, no send)
app.post('/api/preview', requireAuth, async (req, res) => {
  try {
    const settings = db.getSettings(req.user.id);
    const customTopics = db.getCustomTopics(req.user.id);
    const { topic } = pickTopic(settings, customTopics.length > 0 ? customTopics : null);

    // Get upload text if topic_source = files
    let uploadedText = null;
    if (settings.topic_source === 'files') {
      const uploads = db.getUploads(req.user.id);
      if (uploads.length > 0) {
        uploadedText = db.getUploadText(uploads[0].id, req.user.id);
      }
      if (!uploadedText && topic.sourceFile) {
        const { extractTextFromFile } = require('./engine');
        uploadedText = await extractTextFromFile(topic.sourceFile);
      }
    }

    const { subject, html: bodyHtml } = await generateEmailContent(topic, settings, uploadedText);
    const imageDataUri = await generateImage(topic, subject);
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const fullHtml = buildFullHtml(subject, bodyHtml, topic, date, imageDataUri);

    res.json({ ok: true, subject, html: fullHtml });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Send now (generate + send immediately)
app.post('/api/send-now', requireAuth, async (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user.onboarded) {
    return res.status(400).json({ error: 'Please complete your setup first using the onboarding wizard.' });
  }
  try {
    await sendEmailForUser(req.user.id, req.user.email);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// View sent email HTML
app.get('/api/email/:id', requireAuth, (req, res) => {
  const html = db.getSentEmailHtml(parseInt(req.params.id), req.user.id);
  if (!html) return res.status(404).send('Not found');
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// --- Core send function ---
async function sendEmailForUser(userId, email) {
  const settings = db.getSettings(userId);
  const customTopics = db.getCustomTopics(userId);
  const { topic, total } = pickTopic(settings, customTopics.length > 0 ? customTopics : null);

  // Get source text — fall back to internet (null uploadedText) if no files available
  let uploadedText = null;
  if (settings.topic_source !== 'internet') {
    const uploads = db.getUploads(userId);
    if (uploads.length > 0) {
      const rawText = db.getUploadText(uploads[0].id, userId);
      if (rawText) {
        const { findRelevantWindow } = require('./engine');
        uploadedText = findRelevantWindow ? findRelevantWindow(rawText, topic.concept) : rawText.slice(0, 3000);
      }
    }
    if (!uploadedText && topic.sourceFile) {
      const { extractTextFromFile } = require('./engine');
      uploadedText = await extractTextFromFile(topic.sourceFile);
    }
    // If still no text, fall through with uploadedText = null (engine uses internet search context)
    if (!uploadedText) {
      console.log(`[BriefStack] No source text for user ${userId} — using internet-search mode`);
    }
  }

  const { subject, html: bodyHtml } = await generateEmailContent(topic, settings, uploadedText);
  const imageDataUri = await generateImage(topic, subject);

  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const sessionToken = db.getDb().prepare('SELECT token FROM magic_links WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId);
  const userRecord = db.getUserById(userId);
  const fullHtml = buildFullHtml(subject, bodyHtml, topic, date, imageDataUri, sessionToken ? sessionToken.token : null, userRecord.first_name || '');

  await sendBrevoEmail(email, `[BriefStack] ${subject}`, fullHtml);

  db.saveSentEmail(userId, subject, fullHtml, topic.concept, topic.course);
  db.incrementTopicIndex(userId, total);

  console.log(`[BriefStack] Sent to ${email}: ${subject}`);
}

// --- Per-user cron: fires every hour, sends to users whose send_hour matches UTC hour ---
cron.schedule('0 * * * *', async () => {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcDow = now.getUTCDay();
  const users = db.getActiveUsersForHour(utcHour, utcDow);
  console.log(`[Cron] UTC hour ${utcHour} dow ${utcDow} - ${users.length} user(s) to send`);
  for (const u of users) {
    try {
      await sendEmailForUser(u.id, u.email);
    } catch (e) {
      console.error(`[Cron] Failed for ${u.email}:`, e.message);
    }
  }
});

app.listen(PORT, () => {
  console.log(`BriefStack running at ${BASE_URL}`);
});
