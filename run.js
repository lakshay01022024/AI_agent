// ============================================================
// run.js — Entry Point
// Bootstraps environment and launches the outreach agent
// ============================================================

import dotenv from "dotenv";
import { executeAgent } from "./agent.js";
import agent from "./agent.js";

// ── Load environment variables ──────────────────────────────
dotenv.config();

// ── Validate required environment variables ─────────────────
const REQUIRED_ENV = [
  "OPENAI_API_KEY",
  "GMAIL_CLIENT_ID",
  "GMAIL_CLIENT_SECRET",
  "GMAIL_REDIRECT_URI",
  "GMAIL_REFRESH_TOKEN",
  "GMAIL_SENDER_EMAIL",
];

function validateEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("\n❌ Missing required environment variables:\n");
    missing.forEach((key) => console.error(`   • ${key}`));
    console.error("\n   Copy .env.example to .env and fill in your credentials.\n");
    process.exit(1);
  }
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  try {
    validateEnv();

    console.log("\n🚀 Initializing AI Cold Outreach Agent...\n");
    console.log(`   Agent Name:  ${agent.name}`);
    console.log(`   Max Leads:   ${agent.config.maxLeadsPerRun}`);
    console.log(`   Delay Range: ${agent.config.minDelaySec}–${agent.config.maxDelaySec}s`);
    console.log("");

    await executeAgent(agent);
  } catch (err) {
    console.error("\n💥 Fatal error:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
