// ============================================================
// agent.js — Agent Definition & Execution Engine
// Defines the outreach agent and its orchestration logic
// ============================================================

import { readLeads, generateMessage, sendEmailTool } from "./tools.js";

// ── Agent Configuration ─────────────────────────────────────
const agent = {
  name: "OutreachAgent",
  goal: "Send personalized, high-quality cold outreach emails to potential leads while maintaining a human touch and respecting anti-spam best practices.",
  instructions: [
    "Read leads from the CSV data source",
    "Prioritize high-value leads (e.g., Google, Meta, top-tier companies)",
    "Limit outreach to a maximum of 10 leads per run to avoid spam flags",
    "Generate a unique, personalized email for each lead — no templates",
    "Send each email via Gmail API with proper formatting",
    "Wait a random interval (30–120 seconds) between sends to mimic human behavior",
    "Log all actions for transparency and debugging",
  ],
  tools: {
    readLeads,
    generateMessage,
    sendEmail: sendEmailTool,
  },
  config: {
    maxLeadsPerRun: 10,
    minDelaySec: 30,
    maxDelaySec: 120,
    highPriorityCompanies: ["Google", "Meta", "Apple", "Amazon", "Microsoft", "Netflix"],
  },
};

// ── Utility: random delay within a range ────────────────────
function randomDelay(minSec, maxSec) {
  const ms = (Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec) * 1000;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Utility: styled console logging ─────────────────────────
function log(icon, message) {
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
  console.log(`  ${icon}  [${timestamp}] ${message}`);
}

/**
 * Prioritize leads — high-value companies bubble to the top.
 *
 * @param {Array} leads
 * @param {Array<string>} priorityCompanies
 * @returns {Array} Sorted leads array
 */
function prioritizeLeads(leads, priorityCompanies) {
  const normalize = (str) => str.toLowerCase().trim();
  const prioritySet = new Set(priorityCompanies.map(normalize));

  return [...leads].sort((a, b) => {
    const aIsPriority = prioritySet.has(normalize(a.company));
    const bIsPriority = prioritySet.has(normalize(b.company));

    if (aIsPriority && !bIsPriority) return -1;
    if (!aIsPriority && bIsPriority) return 1;
    return 0;
  });
}

/**
 * Execute the outreach agent.
 * This is the main orchestration loop that drives the entire workflow.
 *
 * @param {Object} agentDef — The agent definition object
 */
export async function executeAgent(agentDef = agent) {
  const { config, tools } = agentDef;

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║        🤖  AI Cold Outreach Agent v1.0          ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  log("📋", `Agent: ${agentDef.name}`);
  log("🎯", `Goal: ${agentDef.goal}`);
  console.log("");

  // ── Step 1: Load leads ──────────────────────────────────
  log("🔍", "Reading leads from CSV...");
  let leads;
  try {
    leads = await tools.readLeads();
  } catch (err) {
    log("❌", `Failed to read leads: ${err.message}`);
    return;
  }
  log("✅", `Loaded ${leads.length} leads from data source`);

  // ── Step 2: Prioritize leads ────────────────────────────
  log("🧠", "Thinking... analyzing lead priority...");
  leads = prioritizeLeads(leads, config.highPriorityCompanies);

  const highPriority = leads.filter((l) =>
    config.highPriorityCompanies.some(
      (c) => c.toLowerCase() === l.company.toLowerCase()
    )
  );
  if (highPriority.length > 0) {
    log("⭐", `Found ${highPriority.length} high-priority leads: ${highPriority.map((l) => `${l.name} (${l.company})`).join(", ")}`);
  }

  // ── Step 3: Cap at max per run ──────────────────────────
  const batch = leads.slice(0, config.maxLeadsPerRun);
  log("📊", `Processing ${batch.length} of ${leads.length} leads (max ${config.maxLeadsPerRun} per run)`);
  console.log("\n" + "─".repeat(52) + "\n");

  // ── Step 4: Process each lead ───────────────────────────
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < batch.length; i++) {
    const lead = batch[i];
    const isPriority = config.highPriorityCompanies.some(
      (c) => c.toLowerCase() === lead.company.toLowerCase()
    );

    console.log(`  ┌─── Lead ${i + 1}/${batch.length} ${isPriority ? "⭐ HIGH PRIORITY" : ""}`);
    console.log(`  │  Name:    ${lead.name}`);
    console.log(`  │  Email:   ${lead.email}`);
    console.log(`  │  Company: ${lead.company}`);
    console.log(`  │  Role:    ${lead.role || "N/A"}`);

    // ── Generate personalized message ───────────────────
    try {
      log("💭", "Thinking... crafting personalized message...");
      log("✍️ ", "Generating message with AI...");

      const { subject, body } = await tools.generateMessage(lead);

      console.log(`  │  Subject: "${subject}"`);
      console.log(`  │`);

      // ── Send email ────────────────────────────────────
      log("📤", "Sending email via Gmail...");

      await tools.sendEmail({
        email: lead.email,
        subject,
        message: body,
      });

      log("✅", `Email sent successfully to ${lead.email}`);
      successCount++;
    } catch (err) {
      log("❌", `Failed for ${lead.name}: ${err.message}`);
      failCount++;
    }

    // ── Delay between sends (skip after last one) ───────
    if (i < batch.length - 1) {
      const delaySec =
        Math.floor(Math.random() * (config.maxDelaySec - config.minDelaySec + 1)) +
        config.minDelaySec;
      log("⏳", `Waiting ${delaySec}s before next send (anti-spam delay)...`);
      await randomDelay(config.minDelaySec, config.maxDelaySec);
    }

    console.log("  └" + "─".repeat(50) + "\n");
  }

  // ── Summary ─────────────────────────────────────────────
  console.log("═".repeat(52));
  log("📊", "Run Complete!");
  log("✅", `Sent: ${successCount}`);
  log("❌", `Failed: ${failCount}`);
  log("📋", `Total Processed: ${batch.length}`);
  console.log("═".repeat(52) + "\n");
}

export default agent;
