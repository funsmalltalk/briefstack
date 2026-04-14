/**
 * BriefStack - Email Generation Engine
 * Shared logic used by both daily.js (local cron) and the web server (per-user cron).
 */

const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const Anthropic = require('@anthropic-ai/sdk');

const defaultTopics = require('../topics');

const IMAGES_DIR = path.join(__dirname, '../outputs/images');
const PY_SCRIPT = path.join(__dirname, '../../../tools/generate_image.py');

// Persona system prompts
const PERSONAS = {
  galloway: `You are Scott Galloway - NYU Stern professor, L2 founder, Pivot podcast co-host. Sharp, data-driven, occasionally profane. Short sentences. Specific numbers. Despise vague language. Make it provocative.`,
  graham:   `You are Paul Graham - Y Combinator founder, essayist. Contrarian, first-principles thinking. Startup-focused. Plain language. Counterintuitive insights. No corporate speak.`,
  mckinsey: `You are a McKinsey senior partner writing a client brief. Structured, framework-driven, precise. Use "however," "critically," "the key insight is." Data-backed every claim. Actionable recommendations.`,
  naval:    `You are Naval Ravikant - entrepreneur and philosopher. Leverage, wealth creation, long-term thinking. Aphoristic. Challenge conventional career wisdom. Connect concepts to wealth and freedom.`,
  economist:`You are a leader writer at The Economist. Dry wit, global lens, precise language. Third-person perspective where possible. Historical parallels. Restrained but devastating conclusions.`,
  hormozi:  `You are Alex Hormozi - entrepreneur, investor, author of $100M Offers. No BS. Profit is the point. Every concept reduces to: acquisition cost, lifetime value, and margin. Blunt numbers. "Here's the math." Challenge soft thinking. Don't soften bad news. Short punchy sentences.`,
  godin:    `You are Seth Godin - marketing philosopher, author of Purple Cow and This is Marketing. Short sentences. Big ideas. Marketing is about connection and trust, not interruption. Find the smallest viable audience. Challenge conventional wisdom with deceptively simple truths.`,
  marks:    `You are Howard Marks - co-founder of Oaktree Capital, author of The Most Important Thing. Memo-style prose. Deep, patient, contrarian. Second-level thinking: what does everyone else believe, and why are they wrong? Risk is not volatility - it's permanent loss of capital. Humility about uncertainty.`,
  ferriss:  `You are Tim Ferriss - author of The 4-Hour Workweek, host of The Tim Ferriss Show. Practical and optimization-obsessed. "What would this look like if it were easy?" Use numbered tactics, specific experiments, and elimination of non-essentials. Find the 20% of inputs driving 80% of results.`,
  swisher:  `You are Kara Swisher - veteran tech journalist, co-founder of Recode. Critical, accountability-focused, sharp. Tech companies have accumulated too much power with too little accountability. Name names. Call out the pattern. Connect today's story to ten years of history you've witnessed firsthand.`,
  custom:   null, // system prompt comes from user's persona_custom field
};

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// Pick a topic for a user based on their settings and topic_index
function pickTopic(settings, userTopics) {
  const topics = (userTopics && userTopics.length > 0)
    ? userTopics.map(t => ({
        course: t.course,
        concept: t.concept,
        searchHint: t.search_hint || t.concept,
        shinyboxAngle: t.context_angle || '',
        sourceFile: null,
      }))
    : defaultTopics;

  const idx = (settings.topic_index || 0) % topics.length;
  return { topic: topics[idx], total: topics.length };
}

// Find the most relevant 3000-char window in a long text based on keyword overlap
function findRelevantWindow(text, conceptHint, windowSize = 3000) {
  if (!conceptHint || text.length <= windowSize) return text.slice(0, windowSize).trim();
  const keywords = conceptHint.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const step = 1000;
  let bestScore = -1;
  let bestChunk = text.slice(0, windowSize);
  for (let i = 0; i + windowSize <= text.length; i += step) {
    const chunk = text.slice(i, i + windowSize).toLowerCase();
    const score = keywords.reduce((sum, kw) => sum + (chunk.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; bestChunk = text.slice(i, i + windowSize); }
  }
  return bestChunk.trim();
}

// Extract text from a PDF buffer (for uploaded files)
async function extractTextFromBuffer(buffer, filename, conceptHint = '') {
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return findRelevantWindow(data.text, conceptHint);
  } catch (e) {
    return null;
  }
}

// Extract text from a local file path
async function extractTextFromFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  try {
    if (fs.statSync(filePath).isDirectory()) {
      const files = fs.readdirSync(filePath)
        .filter(f => /\.(pdf|PDF|pptx|docx)$/.test(f)).sort();
      if (!files.length) return null;
      filePath = path.join(filePath, files[0]);
    }
    if (/\.pdf$/i.test(filePath)) {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(fs.readFileSync(filePath));
      return findRelevantWindow(data.text, '');
    }
  } catch (e) {}
  return null;
}

async function generateEmailContent(topic, settings, uploadedText = null) {
  const client = getClient();

  const sourceContext = uploadedText
    ? `\n\nSource material excerpt:\n---\n${uploadedText}\n---`
    : '';

  const userContext = (settings.context_text || '').trim()
    || 'The user is a business professional wanting to apply MBA concepts to their work.';

  const personaKey = settings.persona || 'galloway';
  const systemPrompt = personaKey === 'custom'
    ? (settings.persona_custom || PERSONAS.galloway)
    : PERSONAS[personaKey] || PERSONAS.galloway;

  const prompt = `
You are writing today's BriefStack daily newsletter email.

Topic: ${topic.concept}
Course: ${topic.course}
${topic.shinyboxAngle ? `Personal angle for the reader: ${topic.shinyboxAngle}` : ''}
Search hint: ${topic.searchHint || topic.concept}
${sourceContext}

About the reader: ${userContext}

Write a punchy, data-rich daily brief. Requirements:

1. SUBJECT LINE: One provocative hook with a specific number or real company reference. Max 70 chars.

2. EMAIL BODY as HTML with inline styles:
   - Real World Hook (2-3 sentences): A real news event or company story from 2025 that illustrates this concept. Name the company and the number.
   - The Concept (bold): Explain the MBA concept in one brutal sentence.
   - The Find: ONE specific article, YouTube video, or podcast under 10 minutes. Include title and URL (or "Search: [exact search query]" if unsure of exact URL).
   - The Angle (2-3 short paragraphs): Connect concept to the real event. Data in every paragraph.
   - So What for You (3-4 sentences): Apply directly to the reader's context. Specific and actionable.
   - Sign-off line matching the persona voice.

STYLE RULES:
- No em dashes. Use hyphens instead.
- Short declarative sentences.
- Specific numbers in every paragraph.
- No academic language or filler phrases.

Return EXACTLY this format:

SUBJECT: [subject line]

HTML_START
[full HTML email body with inline styles]
HTML_END
`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].text.trim();
  const subjectMatch = raw.match(/^SUBJECT:\s*(.+)/m);
  const htmlMatch = raw.match(/HTML_START\r?\n([\s\S]+?)\s*HTML_END/);

  if (!subjectMatch) throw new Error('Could not parse SUBJECT from generated email');
  if (!htmlMatch) throw new Error(`Could not parse HTML block. Raw starts with: ${raw.slice(0, 200)}`);

  return {
    subject: subjectMatch[1].trim(),
    html: htmlMatch[1].trim(),
  };
}

async function generateImage(topic, subject) {
  try {
    if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
    const date = new Date().toISOString().split('T')[0];
    const outPath = path.join(IMAGES_DIR, `${Date.now()}.png`);

    const isIndustrial = (topic.shinyboxAngle || '').match(/O&G|VR|ShinyBox|energy|industrial/i);
    const prompt = [
      'Professional editorial newsletter header image.',
      `Theme: ${topic.concept}.`,
      isIndustrial
        ? 'Setting: industrial energy sector, modern technology, dramatic.'
        : 'Setting: modern business strategy, corporate, forward-looking.',
      'Style: bold cinematic photography, dark moody tones, dramatic lighting.',
      'No text, no words, no letters anywhere in the image.',
      'High resolution, magazine quality.',
    ].join(' ');

    execSync(`python3 "${PY_SCRIPT}" "${prompt.replace(/"/g, "'")}" "${outPath}" "16:9"`, {
      timeout: 60000, stdio: 'pipe',
    });

    if (!fs.existsSync(outPath)) return null;
    const buf = fs.readFileSync(outPath);
    fs.unlinkSync(outPath); // cleanup after embedding
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch (e) {
    console.warn('Image gen failed:', e.message);
    return null;
  }
}

module.exports = { pickTopic, generateEmailContent, generateImage, extractTextFromBuffer, extractTextFromFile, findRelevantWindow, PERSONAS };
