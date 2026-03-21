// ============================================================
// mailer.js — Gmail API Integration
// Handles OAuth2 authentication and email dispatch via Gmail
// ============================================================

import { google } from "googleapis";

// ── Build OAuth2 client from environment variables ──────────
function createOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

  // Set the refresh token — this auto-fetches a new access token when needed
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  return oauth2Client;
}

/**
 * Encode an email into RFC 2822 format for the Gmail API.
 *
 * @param {string} to      — Recipient email address
 * @param {string} from    — Sender email address
 * @param {string} subject — Email subject line
 * @param {string} body    — Plain-text email body
 * @returns {string} Base64url-encoded email string
 */
function encodeEmail(to, from, subject, body) {
  const emailLines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset="UTF-8"`,
    ``,
    body,
  ];

  const rawEmail = emailLines.join("\r\n");

  // Gmail API requires base64url encoding
  return Buffer.from(rawEmail)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Send an email via the Gmail API.
 *
 * @param {Object} options
 * @param {string} options.to      — Recipient email address
 * @param {string} options.subject — Email subject line
 * @param {string} options.body    — Plain-text email body
 * @returns {Promise<Object>} Gmail API response data
 */
export async function sendEmail({ to, subject, body }) {
  const auth = createOAuth2Client();
  const gmail = google.gmail({ version: "v1", auth });

  const senderEmail = process.env.GMAIL_SENDER_EMAIL;
  const raw = encodeEmail(to, senderEmail, subject, body);

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  return response.data;
}
