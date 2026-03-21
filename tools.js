// ============================================================
// tools.js — Agent Tool Registry
// Each tool is a self-contained function the agent can invoke
// ============================================================

import fs from "fs";
import csv from "csv-parser";
import { generateEmail } from "./ai.js";
import { sendEmail as gmailSend } from "./mailer.js";

/**
 * TOOL: readLeads
 * Reads and parses a CSV file into structured lead objects.
 *
 * Expected CSV columns: name, email, company, role
 *
 * @param {string} filePath — Path to the CSV file
 * @returns {Promise<Array<{ name: string, email: string, company: string, role: string }>>}
 */
export function readLeads(filePath = "./leads.csv") {
  return new Promise((resolve, reject) => {
    const leads = [];

    fs.createReadStream(filePath)
      .on("error", (err) => reject(new Error(`Failed to read CSV: ${err.message}`)))
      .pipe(csv())
      .on("data", (row) => {
        // Normalize field names (trim whitespace from headers)
        const lead = {
          name: (row.name || row.Name || "").trim(),
          email: (row.email || row.Email || "").trim(),
          company: (row.company || row.Company || "").trim(),
          role: (row.role || row.Role || "").trim(),
        };

        // Only include leads with valid email addresses
        if (lead.name && lead.email && lead.email.includes("@")) {
          leads.push(lead);
        }
      })
      .on("end", () => resolve(leads))
      .on("error", (err) => reject(err));
  });
}

/**
 * TOOL: generateMessage
 * Generates a personalized cold outreach email for a given lead.
 *
 * @param {{ name: string, company: string, role: string }} lead
 * @returns {Promise<{ subject: string, body: string }>}
 */
export async function generateMessage(lead) {
  const { subject, body } = await generateEmail(lead.name, lead.company, lead.role);
  return { subject, body };
}

/**
 * TOOL: sendEmail
 * Sends a formatted email via the Gmail API.
 *
 * @param {Object} params
 * @param {string} params.email   — Recipient email address
 * @param {string} params.subject — Email subject line
 * @param {string} params.message — Email body content
 * @returns {Promise<Object>} Gmail API response
 */
export async function sendEmailTool({ email, subject, message }) {
  const result = await gmailSend({
    to: email,
    subject,
    body: message,
  });
  return result;
}
