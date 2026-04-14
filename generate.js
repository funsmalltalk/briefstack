/**
 * Prof G Email Generator
 * Reads a PDF excerpt from Omer's actual MBA materials,
 * then asks Claude to write a Galloway-style daily brief.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IMAGES_DIR = path.join(__dirname, 'outputs', 'images');

// Generate a 16:9 header image using Google Imagen 4 via generate_image.py
async function generateImage(topic, subject) {
  try {
    if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

    const date = new Date().toISOString().split('T')[0];
    const outPath = path.join(IMAGES_DIR, `${date}.png`);

    // Build a cinematic, no-text editorial prompt
    const prompt = [
      'Professional editorial newsletter header image.',
      `Theme: ${topic.concept}.`,
      topic.shinyboxAngle.includes('O&G') || topic.shinyboxAngle.includes('VR') || topic.shinyboxAngle.includes('ShinyBox')
        ? 'Setting: industrial energy sector, Houston, modern technology.'
        : 'Setting: modern business, strategy, corporate environment.',
      'Style: bold cinematic photography, dark moody tones, dramatic lighting, sharp focus.',
      'No text, no words, no letters, no numbers in the image.',
      'High resolution, magazine quality.',
    ].join(' ');

    const pyScript = path.join(__dirname, '../../tools/generate_image.py');
    execSync(`python3 "${pyScript}" "${prompt.replace(/"/g, "'")}" "${outPath}" "16:9"`, {
      timeout: 60000,
      stdio: 'pipe',
    });

    if (!fs.existsSync(outPath)) return null;

    // Return as base64 data URI for inline embedding
    const imgBuffer = fs.readFileSync(outPath);
    return `data:image/png;base64,${imgBuffer.toString('base64')}`;
  } catch (e) {
    console.warn('Image generation failed (continuing without image):', e.message);
    return null;
  }
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Try to extract text from a PDF or read a text file
async function extractSourceText(sourceFile) {
  if (!sourceFile) return null;

  // Try exact path first
  let filePath = sourceFile;

  // If it's a directory, try to find the first PDF inside
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      const files = fs.readdirSync(filePath)
        .filter(f => f.endsWith('.pdf') || f.endsWith('.PDF') || f.endsWith('.pptx') || f.endsWith('.docx'))
        .sort();
      if (files.length > 0) {
        filePath = path.join(filePath, files[0]);
      } else {
        return null;
      }
    }
  } catch (e) {
    return null;
  }

  if (!fs.existsSync(filePath)) return null;

  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      // Return first 3000 chars of text
      return data.text.slice(0, 3000).trim();
    } catch (e) {
      return null;
    }
  }

  if (ext === '.docx') {
    try {
      // Try reading raw text (won't be perfect but gets content)
      const content = fs.readFileSync(filePath);
      // Extract readable ASCII text from docx binary
      const text = content.toString('utf8')
        .replace(/[^\x20-\x7E\n]/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 3000)
        .trim();
      return text.length > 100 ? text : null;
    } catch (e) {
      return null;
    }
  }

  return null;
}

const SHINYBOX_CONTEXT = `
Omer is the BD Lead at ShinyBox Interactive — a small industrial VR training company in Houston transitioning from custom services to a SaaS platform. Clients are O&G (oil and gas) companies. The core pitch: VR training reduces HSE (health, safety, environment) incidents. One avoided O&G incident saves $500K-$5M. ShinyBox charges $100K-$200K/year, which makes it a cheap insurance policy. The challenge: ShinyBox doesn't yet track training outcomes, so they're selling on "better experience" rather than "incident reduction." Omer was hired to build the commercial function from scratch and drive the services-to-SaaS transition. Daniel is the founder/CEO; his personal network is currently the only lead source.
`.trim();

async function generateEmail(topic, sourceExcerpt) {
  const sourceContext = sourceExcerpt
    ? `\n\nHere is an excerpt from Omer's actual Rice MBA course material on this topic:\n---\n${sourceExcerpt}\n---`
    : '';

  const prompt = `
You are writing today's email for Omer Biton's "Prof G Daily" newsletter — a daily MBA re-engagement email written in Scott Galloway's voice.

Topic: ${topic.concept}
Course: ${topic.course}
Omer's ShinyBox angle: ${topic.shinyboxAngle}
Search hint (find a real article/event): ${topic.searchHint}
${sourceContext}

Write a punchy, data-rich email in Scott Galloway's style. Requirements:

1. SUBJECT LINE: One brutal, provocative hook. Make it specific with a number or real reference. Max 70 chars.

2. EMAIL BODY (return as HTML with inline styles):
   - Real World Hook (2-3 sentences): Open with a real news event, company announcement, or market data from 2025 that illustrates this concept. Be specific — name the company, the number, the event. This is not optional.
   - The Concept (1-2 sentences bold): Explain the MBA concept in one brutal sentence. No jargon.
   - The Find: Recommend ONE specific real resource — a specific YouTube video, podcast episode, or article under 10 minutes. Include the actual title and URL. If you cannot verify a specific URL, name the resource clearly (e.g., "Search: HBR 'What Is Strategy' Porter 1996") and explain why it's worth 8 minutes.
   - The MBA Angle (2-3 short paragraphs): Connect the concept to the real world event. Data in every paragraph. Short sentences. Galloway rhythm — no fluff.
   - So What for Omer (3-4 sentences): Directly apply to ShinyBox BD role. Specific and actionable. Not generic advice.
   - Sign-off: "- Prof G (your digital one)"

STYLE RULES:
- Write like Galloway: short declarative sentences, provocative openers, specific data points, occasional irreverence
- No em dashes (—). Use hyphens (-) instead.
- No academic language. No "it is important to note that."
- Every paragraph has a number, a company name, or a real claim.
- "So What for Omer" must be about ShinyBox specifically, not generic MBA advice.

Return your response using EXACTLY this format with these delimiters - nothing else:

SUBJECT: [your subject line here]

HTML_START
[your full HTML email body here with inline styles]
HTML_END
`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: `You are Scott Galloway - NYU Stern professor, founder of L2 and Pivot podcast co-host. You write sharp, data-driven, occasionally profane business commentary. You connect academic concepts to real business events. You despise vague language and love specific numbers. Context on the reader: ${SHINYBOX_CONTEXT}`,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].text.trim();

  // Parse using delimiters
  const subjectMatch = raw.match(/^SUBJECT:\s*(.+)/m);
  const htmlMatch = raw.match(/HTML_START\r?\n([\s\S]+?)\s*HTML_END/);

  if (!subjectMatch) throw new Error('Could not parse SUBJECT from response');
  if (!htmlMatch) throw new Error('Could not parse HTML_START...HTML_END from response');

  return {
    subject: subjectMatch[1].trim(),
    html: htmlMatch[1].trim(),
  };
}

module.exports = { generateEmail, extractSourceText, generateImage };
