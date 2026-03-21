# 🤖 AI Cold Outreach Agent

A production-ready AI agent that performs personalized cold outreach via email. Built with Node.js, OpenAI API, and Gmail API.

## Architecture

```
┌─────────────┐     ┌──────────┐     ┌──────────┐
│   run.js    │────▶│ agent.js │────▶│ tools.js │
│ (bootstrap) │     │ (brain)  │     │ (skills) │
└─────────────┘     └──────────┘     └────┬─────┘
                                          │
                              ┌───────────┼───────────┐
                              ▼           ▼           ▼
                         ┌────────┐  ┌────────┐  ┌──────────┐
                         │ ai.js  │  │mailer.js│  │leads.csv │
                         │(OpenAI)│  │ (Gmail) │  │  (data)  │
                         └────────┘  └────────┘  └──────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in your API credentials in `.env`:

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `GMAIL_CLIENT_ID` | Google OAuth2 client ID |
| `GMAIL_CLIENT_SECRET` | Google OAuth2 client secret |
| `GMAIL_REDIRECT_URI` | OAuth2 redirect URI |
| `GMAIL_REFRESH_TOKEN` | Gmail refresh token |
| `GMAIL_SENDER_EMAIL` | Your Gmail address |

### 3. Set Up Gmail API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the **Gmail API**
4. Create **OAuth 2.0 credentials** (Desktop App)
5. Use [OAuth Playground](https://developers.google.com/oauthplayground/) to get a refresh token:
   - Set OAuth scope: `https://mail.google.com/`
   - Authorize with your Gmail account
   - Exchange authorization code for tokens
   - Copy the **refresh token** to your `.env`

### 4. Add Your Leads

Edit `leads.csv` with your target leads:

```csv
name,email,company,role
John Doe,john@example.com,Google,Software Engineer
```

### 5. Run the Agent

```bash
npm start
```

## Features

- **AI-Powered Personalization** — Every email is uniquely crafted by GPT-4o-mini
- **Smart Prioritization** — FAANG/top-tier company leads are processed first
- **Anti-Spam Compliance** — Random delays (30–120s), no spam trigger words, human tone
- **Rate Limiting** — Max 10 emails per run to protect sender reputation
- **Detailed Logging** — Real-time progress with styled console output
- **Modular Architecture** — Clean separation of concerns across modules

## Agent Behavior

The agent follows these principles:
1. Reads leads from CSV and validates data
2. Prioritizes high-value leads (Google, Meta, Apple, Amazon, Microsoft, Netflix)
3. Generates a **unique** personalized email for each lead (not templated)
4. Sends via Gmail with proper RFC 2822 formatting
5. Waits a random 30–120 second delay between sends
6. Logs all actions with timestamps

## File Structure

| File | Purpose |
|------|---------|
| `run.js` | Entry point — env validation and agent bootstrap |
| `agent.js` | Agent definition — config, orchestration, prioritization |
| `tools.js` | Tool registry — readLeads, generateMessage, sendEmail |
| `ai.js` | OpenAI integration — email generation with crafted prompts |
| `mailer.js` | Gmail API — OAuth2 auth and email dispatch |
| `leads.csv` | Input data — your target leads |
| `.env` | Credentials (not committed) |

## Anti-Spam Best Practices

- ✅ Random delay between sends (30–120 seconds)
- ✅ Maximum 10 emails per run
- ✅ No spam trigger words in generated content
- ✅ Personalized content (not templated)
- ✅ Professional tone with soft CTA
- ✅ Proper email formatting (RFC 2822)

## License

MIT
