/**
 * BriefStack - SQLite Database
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'briefstack.db');

let db;

function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    migrate(db);
  }
  return db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS magic_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      user_id INTEGER PRIMARY KEY,
      persona TEXT DEFAULT 'galloway',
      persona_custom TEXT,
      context_text TEXT DEFAULT '',
      topic_source TEXT DEFAULT 'files',
      send_hour INTEGER DEFAULT 7,
      timezone TEXT DEFAULT 'America/Chicago',
      active INTEGER DEFAULT 1,
      topic_index INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      parsed_text TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS custom_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course TEXT NOT NULL,
      concept TEXT NOT NULL,
      search_hint TEXT,
      context_angle TEXT,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sent_emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      sent_at TEXT DEFAULT (datetime('now')),
      subject TEXT,
      html TEXT,
      topic_concept TEXT,
      topic_course TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

// --- User helpers ---

function findOrCreateUser(email) {
  const db = getDb();
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    const res = db.prepare('INSERT INTO users (email) VALUES (?)').run(email);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(res.lastInsertRowid);
    // Create default settings
    db.prepare('INSERT OR IGNORE INTO settings (user_id) VALUES (?)').run(user.id);
  }
  return user;
}

function getUserByEmail(email) {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function getUserById(id) {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function updateLastLogin(userId) {
  getDb().prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(userId);
}

// --- Magic link helpers ---

function createMagicLink(userId, token, expiresAt) {
  getDb().prepare('INSERT INTO magic_links (user_id, token, expires_at) VALUES (?, ?, ?)').run(userId, token, expiresAt);
}

function getMagicLink(token) {
  return getDb().prepare('SELECT * FROM magic_links WHERE token = ? AND used = 0').get(token);
}

function consumeMagicLink(token) {
  getDb().prepare('UPDATE magic_links SET used = 1 WHERE token = ?').run(token);
}

// --- Settings helpers ---

function getSettings(userId) {
  const db = getDb();
  let s = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(userId);
  if (!s) {
    db.prepare('INSERT OR IGNORE INTO settings (user_id) VALUES (?)').run(userId);
    s = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(userId);
  }
  return s;
}

function saveSettings(userId, updates) {
  const allowed = ['persona', 'persona_custom', 'context_text', 'topic_source', 'send_hour', 'timezone', 'active'];
  const fields = Object.keys(updates).filter(k => allowed.includes(k) && updates[k] !== undefined && updates[k] !== null);
  if (!fields.length) return;
  const set = fields.map(f => `${f} = ?`).join(', ');
  const vals = fields.map(f => {
    const v = updates[f];
    // SQLite node:sqlite requires strings/numbers/null - convert booleans
    if (typeof v === 'boolean') return v ? 1 : 0;
    return v;
  });
  getDb().prepare(`UPDATE settings SET ${set} WHERE user_id = ?`).run(...vals, userId);
}

function incrementTopicIndex(userId, total) {
  const s = getSettings(userId);
  const next = (s.topic_index + 1) % total;
  getDb().prepare('UPDATE settings SET topic_index = ? WHERE user_id = ?').run(next, userId);
  return s.topic_index;
}

// --- Uploads ---

function saveUpload(userId, filename, originalName, parsedText) {
  return getDb().prepare('INSERT INTO uploads (user_id, filename, original_name, parsed_text) VALUES (?, ?, ?, ?)').run(userId, filename, originalName, parsedText);
}

function getUploads(userId) {
  return getDb().prepare('SELECT id, original_name, created_at FROM uploads WHERE user_id = ? ORDER BY created_at DESC').all(userId);
}

function getUploadText(uploadId, userId) {
  const row = getDb().prepare('SELECT parsed_text FROM uploads WHERE id = ? AND user_id = ?').get(uploadId, userId);
  return row ? row.parsed_text : null;
}

function deleteUpload(uploadId, userId) {
  getDb().prepare('DELETE FROM uploads WHERE id = ? AND user_id = ?').run(uploadId, userId);
}

// --- Custom topics ---

function getCustomTopics(userId) {
  return getDb().prepare('SELECT * FROM custom_topics WHERE user_id = ? ORDER BY sort_order ASC, id ASC').all(userId);
}

function addCustomTopic(userId, course, concept, searchHint, contextAngle) {
  return getDb().prepare('INSERT INTO custom_topics (user_id, course, concept, search_hint, context_angle) VALUES (?, ?, ?, ?, ?)').run(userId, course, concept, searchHint || '', contextAngle || '');
}

function deleteCustomTopic(topicId, userId) {
  getDb().prepare('DELETE FROM custom_topics WHERE id = ? AND user_id = ?').run(topicId, userId);
}

// --- Sent emails ---

function saveSentEmail(userId, subject, html, topicConcept, topicCourse) {
  getDb().prepare('INSERT INTO sent_emails (user_id, subject, html, topic_concept, topic_course) VALUES (?, ?, ?, ?, ?)').run(userId, subject, html, topicConcept, topicCourse);
}

function getSentEmails(userId, limit = 30) {
  return getDb().prepare('SELECT id, sent_at, subject, topic_concept, topic_course FROM sent_emails WHERE user_id = ? ORDER BY sent_at DESC LIMIT ?').all(userId, limit);
}

function getSentEmailHtml(emailId, userId) {
  const row = getDb().prepare('SELECT html FROM sent_emails WHERE id = ? AND user_id = ?').get(emailId, userId);
  return row ? row.html : null;
}

// --- Active users (for cron) ---

function getActiveUsersForHour(utcHour) {
  return getDb().prepare(`
    SELECT u.id, u.email, s.*
    FROM users u
    JOIN settings s ON s.user_id = u.id
    WHERE s.active = 1 AND s.send_hour = ?
  `).all(utcHour);
}

module.exports = {
  getDb,
  findOrCreateUser, getUserByEmail, getUserById, updateLastLogin,
  createMagicLink, getMagicLink, consumeMagicLink,
  getSettings, saveSettings, incrementTopicIndex,
  saveUpload, getUploads, getUploadText, deleteUpload,
  getCustomTopics, addCustomTopic, deleteCustomTopic,
  saveSentEmail, getSentEmails, getSentEmailHtml,
  getActiveUsersForHour,
};
