// ============================================================
// ai.js — LLM Integration Layer
// Handles all OpenAI API interactions for email generation
// ============================================================

import OpenAI from "openai";

// ── Lazy-initialized OpenAI client ─────────────────────────
// Deferred so dotenv.config() in run.js loads the key first
let openai = null;

function getClient() {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

// ── System prompt for cold outreach email generation ────────
const SYSTEM_PROMPT = `You are an expert cold outreach copywriter. Your job is to write short, personalized cold emails that feel genuinely human.

Rules you MUST follow:
- Address the recipient by first name
- Mention their company naturally in context
- Keep the tone warm, conversational, and non-salesy
- Do NOT ask for a referral directly — instead ask for guidance or advice
- Include a soft call-to-action (e.g., "Would love to hear your thoughts")
- Avoid spam trigger words: "free", "guarantee", "act now", "limited time", "click here", "winner"
- Keep the email body under 120 words
- Do NOT include any subject line — only the email body
- Write in first person as a fellow professional
- Sound like a real human, not a template`;

/**
 * Generate a personalized cold outreach email using GPT-4o-mini.
 *
 * @param {string} name    — Recipient's full name
 * @param {string} company — Recipient's company name
 * @param {string} role    — Recipient's job role (optional context)
 * @returns {Promise<{ subject: string, body: string }>}
 */
export async function generateEmail(name, company, role = "") {
  const firstName = name.split(" ")[0];

  const userPrompt = `Write a cold outreach email to ${name}${role ? `, who works as a ${role}` : ""} at ${company}.

I'm a software developer exploring opportunities in the tech space. I admire ${company}'s work and would love ${firstName}'s perspective on how to best position myself for roles at companies like theirs.

Remember: be human, be brief, ask for guidance — not a referral.`;

  const completion = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.85,
    max_tokens: 300,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const body = completion.choices[0].message.content.trim();

  // Generate a matching subject line separately for better control
  const subjectCompletion = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 30,
    messages: [
      {
        role: "system",
        content:
          "Generate a short, casual email subject line (5-10 words max) for a cold outreach email. It should feel personal and NOT spammy. Do not use quotes around it. Do not include 'Subject:' prefix.",
      },
      {
        role: "user",
        content: `The email is to ${firstName} at ${company}, asking for career guidance.`,
      },
    ],
  });

  const subject = subjectCompletion.choices[0].message.content.trim();

  return { subject, body };
}
