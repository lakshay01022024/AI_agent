import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import multer from "multer"; // For future CSV upload support
import { fileURLToPath } from "url";
import agent, { executeAgent, agentEvents } from "./agent.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, "public")));

let isRunning = false;
let sseClients = [];

// ── Broadcast event to all connected SSE clients ────────────
function broadcast(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => client.res.write(payload));
}

// ── Listen to agent events and rebroadcast to frontend ──────
agentEvents.on("log", (data) => broadcast({ type: "log", ...data }));
agentEvents.on("raw", (data) => broadcast({ type: "raw", ...data }));
agentEvents.on("progress", (data) => broadcast({ type: "progress", ...data }));
agentEvents.on("end", (data) => {
  isRunning = false;
  broadcast({ type: "end", ...data });
});

// ── API: Get agent status ───────────────────────────────────
app.get("/api/status", (req, res) => {
  res.json({ isRunning });
});

// ── API: Server-Sent Events (SSE) for real-time logs ────────
app.get("/api/logs", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Send an initial connected message
  res.write(`data: ${JSON.stringify({ type: "connected", message: "Connected to AI Outreach Agent" })}\n\n`);

  sseClients.push({ req, res });

  req.on("close", () => {
    sseClients = sseClients.filter((client) => client.res !== res);
  });
});

// ── API: Start Agent ────────────────────────────────────────
app.post("/api/start", async (req, res) => {
  if (isRunning) {
    return res.status(400).json({ error: "Agent is already running." });
  }

  const { maxLeads } = req.body;

  // Validate env before starting
  if (!process.env.OPENAI_API_KEY || !process.env.GMAIL_REFRESH_TOKEN) {
    return res.status(500).json({ error: "Missing required API credentials in .env file." });
  }

  isRunning = true;
  res.json({ message: "Agent started successfully." });

  // Fire and forget
  try {
    const configOverride = maxLeads ? { maxLeadsPerRun: parseInt(maxLeads, 10) } : {};
    await executeAgent(agent, configOverride);
  } catch (err) {
    console.error("Fatal error during execution:", err);
    isRunning = false;
    broadcast({ type: "error", message: err.message });
  }
});

// ── Start Server ────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Web UI Server running at: http://localhost:${PORT}`);
  console.log(`   Waiting for frontend connections...`);
});
