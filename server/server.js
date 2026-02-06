import express from "express";
import cors from "cors";

const app = express();

// --- Config ---
// Gateway base URL: usually http://127.0.0.1:18789 (when server runs on same host)
const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "http://127.0.0.1:18789";
// Token or password depending on gateway.auth.mode. Token is recommended.
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "";

// Allow CORS from GitHub Pages (or set to * while prototyping).
const ORIGIN = process.env.CORS_ORIGIN || "https://ssc1223.github.io";

app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: ORIGIN,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Serve the prototype for local/remote hosting (optional)
app.use("/", express.static(new URL("../prototype/", import.meta.url).pathname));

app.get("/api/health", async (_req, res) => {
  res.json({ ok: true, gateway: GATEWAY_URL });
});

// POST /api/command
// Body: { agent: "Writer" | "Alex" | ... , text: "..." }
// This calls OpenClaw Gateway /tools/invoke with the `sessions_spawn` tool.
app.post("/api/command", async (req, res) => {
  const { agent, text } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ ok: false, error: "Missing text" });
  }

  if (!GATEWAY_TOKEN) {
    return res.status(500).json({ ok: false, error: "Server missing OPENCLAW_GATEWAY_TOKEN" });
  }

  // Map "agent" label to an agentId allowlisted in your OpenClaw config.
  // Adjust these IDs to match your OpenClaw agents.
  const agentIdMap = {
    Alex: "main",
    Writer: "main",
    SecGuard: "main",
    Lena: "main",
    "N8N 小幫手": "main",
  };

  const agentId = agentIdMap[agent] || "main";

  // Invoke OpenClaw tool via Gateway endpoint.
  // Docs: https://docs.openclaw.ai/gateway/tools-invoke-http-api
  const payload = {
    tool: "sessions_spawn",
    args: {
      agentId,
      task: text,
      cleanup: "keep",
    },
  };

  try {
    const r = await fetch(`${GATEWAY_URL.replace(/\/$/, "")}/tools/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GATEWAY_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok || data.ok === false) {
      return res.status(502).json({ ok: false, status: r.status, data });
    }

    res.json({ ok: true, result: data.result });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`[lazy-office-server] listening on http://127.0.0.1:${port}`);
  console.log(`[lazy-office-server] gateway: ${GATEWAY_URL}`);
});
