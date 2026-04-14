/**
 * BriefStack Web Server
 * Express app with magic-link auth, dashboard, and per-user email cron.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const multer = require('multer');

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

// Simple cookie-based session (token in cookie)
function getSession(req) {
  const token = req.headers['x-session-token'] || req.query.token || (req.headers.cookie || '').match(/bs_token=([^;]+)/)?.[1];
  if (!token) return null;
  const link = db.getMagicLink(token);
  if (!link) return null;
  // Check expiry
  if (new Date(link.expires_at) < new Date()) return null;
  return db.getUserById(link.user_id);
}

function requireAuth(req, res, next) {
  const user = getSession(req);
  if (!user) return res.redirect('/');
  req.user = user;
  next();
}

// --- Email sending ---
function getMailer() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
}

async function sendMagicLink(email, link) {
  const mailer = getMailer();
  await mailer.sendMail({
    from: `"BriefStack" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Your BriefStack login link',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f0f13;border-radius:16px;color:white;">
        <h2 style="color:#7c6af7;margin:0 0 16px;">BriefStack</h2>
        <p style="color:rgba(255,255,255,0.8);margin:0 0 24px;">Click the button below to sign in. Link expires in 1 hour.</p>
        <a href="${link}" style="display:inline-block;background:#7c6af7;color:white;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:15px;">Sign In to BriefStack</a>
        <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:24px 0 0;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}

// --- Routes ---

// Landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
  res.json({ user: { email: user.email, onboarded: user.onboarded || 0, trial_ends: user.trial_ends }, settings, uploads, customTopics, history });
});

// Complete onboarding: save settings, mark onboarded, fire first email
app.post('/api/onboard', requireAuth, async (req, res) => {
  const { context_text, persona, send_hour, timezone } = req.body;
  db.saveSettings(req.user.id, {
    context_text: context_text || '',
    persona: persona || 'galloway',
    send_hour: parseInt(send_hour) || 8,
    timezone: timezone || 'UTC',
    active: 1,
  });
  db.setOnboarded(req.user.id);
  res.json({ ok: true });
  // Fire first email asynchronously after response is sent
  sendEmailForUser(req.user.id, req.user.email).catch(e => console.error('[Onboard] First email failed:', e.message));
});

// Save settings
app.post('/api/settings', requireAuth, (req, res) => {
  const { persona, persona_custom, context_text, topic_source, send_hour, timezone, active } = req.body;
  db.saveSettings(req.user.id, { persona, persona_custom, context_text, topic_source,
    send_hour: parseInt(send_hour) || 12, timezone, active: active ? 1 : 0 });
  res.json({ ok: true });
});

// Upload PDF
app.post('/api/upload', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  let parsedText = null;
  try {
    parsedText = await extractTextFromBuffer(req.file.buffer, req.file.originalname);
  } catch (e) {}
  const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  db.saveUpload(req.user.id, filename, req.file.originalname, parsedText);
  res.json({ ok: true, name: req.file.originalname, chars: parsedText ? parsedText.length : 0 });
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

  // Get source text — pass concept as hint for smarter PDF window selection
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
  }

  const { subject, html: bodyHtml } = await generateEmailContent(topic, settings, uploadedText);
  const imageDataUri = await generateImage(topic, subject);

  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const fullHtml = buildFullHtml(subject, bodyHtml, topic, date, imageDataUri);

  const mailer = getMailer();
  await mailer.sendMail({
    from: `"BriefStack" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `[BriefStack] ${subject}`,
    html: fullHtml,
  });

  db.saveSentEmail(userId, subject, fullHtml, topic.concept, topic.course);
  db.incrementTopicIndex(userId, total);

  console.log(`[BriefStack] Sent to ${email}: ${subject}`);
}

// --- Per-user cron: fires every hour, sends to users whose send_hour matches UTC hour ---
cron.schedule('0 * * * *', async () => {
  const utcHour = new Date().getUTCHours();
  const users = db.getActiveUsersForHour(utcHour);
  console.log(`[Cron] UTC hour ${utcHour} - ${users.length} user(s) to send`);
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
