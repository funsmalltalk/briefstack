/**
 * Prof G Daily - Entry Point
 * Pick today's topic, generate email via Claude, send via Gmail, save output.
 * Usage: node daily.js
 * Preview (no send): node daily.js --preview
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const fs = require('fs');
const path = require('path');
const topics = require('./topics');
const { generateEmail, extractSourceText, generateImage } = require('./generate');
const { sendWithRetry } = require('./send');

const OUTPUTS_DIR = path.join(__dirname, 'outputs');
const isPreview = process.argv.includes('--preview');

// Deterministic daily rotation across all topics
function getTodaysTopic() {
  const epoch = new Date('2024-01-01').getTime();
  const now = Date.now();
  const daysSince = Math.floor((now - epoch) / (1000 * 60 * 60 * 24));
  const index = daysSince % topics.length;
  return { topic: topics[index], index, total: topics.length };
}

async function run() {
  const { topic, index, total } = getTodaysTopic();
  const date = new Date().toISOString().split('T')[0];

  console.log(`Prof G Daily - ${date}`);
  console.log(`Topic ${index + 1}/${total}: ${topic.concept} (${topic.course})`);
  console.log('Reading source material...');

  const sourceExcerpt = await extractSourceText(topic.sourceFile);
  if (sourceExcerpt) {
    console.log(`Source loaded: ${sourceExcerpt.length} chars`);
  } else {
    console.log('No source file found - generating from topic knowledge only');
  }

  console.log('Generating email via Claude...');
  const { subject, html: bodyHtml } = await generateEmail(topic, sourceExcerpt);
  console.log(`Subject: ${subject}`);

  console.log('Generating header image...');
  const imageDataUri = await generateImage(topic, subject);
  console.log(imageDataUri ? 'Image generated.' : 'Image skipped (no image).');

  if (!fs.existsSync(OUTPUTS_DIR)) {
    fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
  }

  if (isPreview) {
    const outPath = path.join(OUTPUTS_DIR, `${date}-preview.html`);
    const { buildFullHtml } = require('./send');
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const previewHtml = (buildFullHtml || (() => `<html><body>${bodyHtml}</body></html>`))(subject, bodyHtml, topic, dateStr, imageDataUri);
    fs.writeFileSync(outPath, previewHtml);
    console.log(`Preview saved: ${outPath}`);
    console.log('Open with: open "' + outPath + '"');
    return;
  }

  console.log('Sending email...');
  const fullHtml = await sendWithRetry(subject, bodyHtml, topic, imageDataUri);

  // Save full sent HTML
  const outPath = path.join(OUTPUTS_DIR, `${date}.html`);
  fs.writeFileSync(outPath, fullHtml);
  console.log(`Email sent to ${process.env.GMAIL_USER}`);
  console.log(`Saved: ${outPath}`);
}

run().catch(err => {
  console.error('Prof G Daily failed:', err.message);
  process.exit(1);
});
