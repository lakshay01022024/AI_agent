document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const maxLeadsInput = document.getElementById('maxLeads');
  const terminal = document.getElementById('terminal');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const livePulse = document.getElementById('livePulse');
  
  const statProcessed = document.getElementById('statProcessed');
  const statSent = document.getElementById('statSent');
  const statFailed = document.getElementById('statFailed');

  // Utility to auto-scroll terminal to bottom
  const scrollToBottom = () => {
    terminal.scrollTop = terminal.scrollHeight;
  };

  // Utility to append HTML line to terminal
  const appendLog = (htmlContent) => {
    const div = document.createElement('div');
    div.innerHTML = htmlContent;
    terminal.appendChild(div);
    scrollToBottom();
  };

  // Utility to escape HTML entities
  const escapeHtml = (unsafe) => {
    if (!unsafe) return "";
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  // ── 1. Setup Server-Sent Events (SSE) ──────────────────────
  const initSSE = () => {
    const source = new EventSource('/api/logs');

    source.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'connected') {
        appendLog(`<div class="log-line text-success">✓ ${data.message}</div>`);
        checkStatus(); // Check if agent is already running
      }

      if (data.type === 'raw') {
        // Raw CLI output
        const escaped = escapeHtml(data.message).replace(/ /g, "&nbsp;");
        appendLog(`<div class="log-line text-dim">${escaped}</div>`);
      }

      if (data.type === 'log') {
        // Structured Log
        let textColorClass = "text-white";
        // Convert info/error/success types to classes
        if (data.type === 'error') textColorClass = "text-error";
        if (data.type === 'success') textColorClass = "text-success";
        
        appendLog(`
          <div class="log-line">
            <span class="timestamp">[${data.timestamp}]</span>
            <span class="icon">${data.icon}</span>
            <span class="${textColorClass}">${escapeHtml(data.message)}</span>
          </div>
        `);
      }

      if (data.type === 'progress') {
        const { current, total, lead } = data;
        statProcessed.innerHTML = `${current} <span class="dim">/ ${total}</span>`;
      }

      if (data.type === 'end') {
        setUIIdle();
        if (data.successCount !== undefined) statSent.innerText = data.successCount;
        if (data.failCount !== undefined) statFailed.innerText = data.failCount;
      }
    };

    source.onerror = (err) => {
        appendLog(`<div class="log-line text-error">⚠ Lost connection to server. Retrying...</div>`);
    };
  };

  initSSE();

  // ── 2. View State Management ────────────────────────────────
  const setUIRunning = () => {
    startBtn.disabled = true;
    startBtn.innerHTML = `
      <svg class="spinner" viewBox="0 0 50 50" style="width:20px;height:20px;animation:spin 2s linear infinite;">
        <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="1, 200" stroke-dashoffset="0" stroke-linecap="round" style="animation:stretch 1.5s ease-in-out infinite;"></circle>
      </svg>
      Agent Running...
    `;
    statusIndicator.classList.add('running');
    statusText.innerText = "Agent is Active";
    livePulse.classList.remove('display-none');
  };

  const setUIIdle = () => {
    startBtn.disabled = false;
    startBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      Start Outreach
    `;
    statusIndicator.classList.remove('running');
    statusText.innerText = "Agent is Idle";
    livePulse.classList.add('display-none');
  };

  // Add styles for the spinner dynamically 
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin { 100% { transform: rotate(360deg); } }
    @keyframes stretch { 0% { stroke-dasharray: 1, 200; stroke-dashoffset: 0; } 50% { stroke-dasharray: 90, 200; stroke-dashoffset: -35px; } 100% { stroke-dasharray: 90, 200; stroke-dashoffset: -124px; } }
  `;
  document.head.appendChild(style);

  // ── 3. Start Agent API Call ─────────────────────────────────
  startBtn.addEventListener('click', async () => {
    const maxLeads = maxLeadsInput.value;
    
    // Reset stats
    statProcessed.innerHTML = `0 <span class="dim">/ 0</span>`;
    statSent.innerText = "0";
    statFailed.innerText = "0";
    terminal.innerHTML = "";
    appendLog(`<div class="log-line text-dim">Initializing engine...</div>`);

    try {
      const res = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxLeads })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to start agent");
      }
      
      setUIRunning();
      
    } catch(err) {
      appendLog(`<div class="log-line text-error">❌ ${escapeHtml(err.message)}</div>`);
    }
  });

  // ── 4. Check API status on load ─────────────────────────────
  const checkStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.isRunning) {
        setUIRunning();
      }
    } catch(e) {}
  };

});
