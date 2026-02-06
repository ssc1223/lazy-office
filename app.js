// Lazy Office prototype (no build step)

const STATUS_STYLES = {
  idle: { label: "idle", color: "#60a5fa" },
  thinking: { label: "thinking", color: "#f59e0b" },
  working: { label: "working", color: "#22c55e" },
  error: { label: "error", color: "#ef4444" },
};

// Positions are percentages within the scene.
// Tune these to match your final artwork.
const AGENTS = [
  {
    id: "alex",
    name: "Alex",
    role: "AI 工程師",
    status: "working",
    x: 28,
    y: 64,
    last: "完成任務：整理技能",
  },
  {
    id: "writer",
    name: "Writer",
    role: "文案專家",
    status: "thinking",
    x: 44,
    y: 63,
    last: "草擬：REST API 文件",
  },
  {
    id: "secguard",
    name: "SecGuard",
    role: "資安守衛",
    status: "idle",
    x: 58,
    y: 55,
    last: "待命：監控外部連結",
  },
  {
    id: "lena",
    name: "Lena",
    role: "研究員",
    status: "working",
    x: 50,
    y: 44,
    last: "整理：AI 熱門話題",
  },
  {
    id: "n8n",
    name: "N8N 小幫手",
    role: "自動化專家",
    status: "working",
    x: 34,
    y: 58,
    last: "串接：Webhook → 任務",
  },
];

let selectedId = null;

const agentLayer = document.getElementById("agentLayer");
const panelBody = document.getElementById("panelBody");
const logEl = document.getElementById("log");

const apiBaseInput = document.getElementById("apiBase");
const saveApiBtn = document.getElementById("saveApi");
const testApiBtn = document.getElementById("testApi");
const cmdText = document.getElementById("cmdText");
const sendCmdBtn = document.getElementById("sendCmd");
const cmdHint = document.getElementById("cmdHint");

function getApiBase() {
  return (localStorage.getItem("lazyOffice.apiBase") || "").trim().replace(/\/$/, "");
}

function setApiBase(v) {
  localStorage.setItem("lazyOffice.apiBase", (v || "").trim().replace(/\/$/, ""));
}

function showCmdHint(text, type = "info") {
  if (!cmdHint) return;
  cmdHint.textContent = text;
  cmdHint.style.color = type === "error" ? "#fca5a5" : type === "success" ? "#86efac" : "#8ca1c7";
}

async function apiGet(path) {
  const base = getApiBase();
  if (!base) throw new Error("Missing API Base URL");
  const r = await fetch(`${base}${path}`, { method: "GET" });
  return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) };
}

async function apiPost(path, body) {
  const base = getApiBase();
  if (!base) throw new Error("Missing API Base URL");
  const r = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) };
}


function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, String(v));
  }
  for (const child of children) node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  return node;
}

function renderAgents() {
  agentLayer.innerHTML = "";

  for (const a of AGENTS) {
    const style = STATUS_STYLES[a.status] || STATUS_STYLES.idle;

    const dot = el("span", { class: "status-dot" });
    dot.style.background = style.color;

    const badge = el(
      "div",
      {
        class: "badge",
        onclick: () => selectAgent(a.id),
        role: "button",
        tabindex: "0",
        "aria-label": `${a.name} (${a.role})`,
      },
      [
        dot,
        el("div", {}, [
          el("div", { class: "name" }, [a.name]),
          el("div", { class: "role" }, [`${a.role} · ${style.label}`]),
        ]),
      ]
    );

    const wrap = el("div", { class: "agent" }, [badge]);
    wrap.style.left = `${a.x}%`;
    wrap.style.top = `${a.y}%`;

    if (a.id === selectedId) wrap.classList.add("selected");

    agentLayer.appendChild(wrap);
  }
}

function selectAgent(id) {
  selectedId = id;
  const a = AGENTS.find((x) => x.id === id);
  if (!a) return;

  const style = STATUS_STYLES[a.status] || STATUS_STYLES.idle;

  panelBody.innerHTML = "";
  panelBody.appendChild(
    el("div", { class: "kv" }, [
      el("div", { class: "k" }, ["名稱"]), el("div", {}, [a.name]),
      el("div", { class: "k" }, ["角色"]), el("div", {}, [a.role]),
      el("div", { class: "k" }, ["狀態"]), el("div", {}, [`${style.label}`]),
      el("div", { class: "k" }, ["最後動作"]), el("div", {}, [a.last]),
    ])
  );

  renderAgents();
  pushLog(`${a.name}`, `選取：${a.role} / ${style.label}`);
}

function fmtTime(d = new Date()) {
  return d.toISOString().slice(11, 19);
}

function pushLog(tag, msg) {
  const line = el("div", { class: "logline" }, [
    el("div", { class: "time" }, [fmtTime()]),
    el("div", { class: "tag" }, [tag]),
    el("div", { class: "msg" }, [msg]),
  ]);

  logEl.prepend(line);
}

function tick() {
  // Simulate random agent updates
  const a = AGENTS[Math.floor(Math.random() * AGENTS.length)];
  const states = ["idle", "thinking", "working"];
  const next = states[Math.floor(Math.random() * states.length)];

  a.status = next;
  a.last =
    next === "working"
      ? "進行中：執行任務"
      : next === "thinking"
        ? "思考中：規劃下一步"
        : "待命：等待指令";

  if (selectedId === a.id) {
    // refresh panel
    selectAgent(a.id);
  } else {
    renderAgents();
    pushLog(a.name, a.last);
  }
}

renderAgents();
pushLog("System", "Lazy Office prototype ready.");

// --- Command UI wiring ---
if (apiBaseInput) apiBaseInput.value = getApiBase();

saveApiBtn?.addEventListener("click", () => {
  setApiBase(apiBaseInput?.value || "");
  showCmdHint("已儲存 API Base URL", "success");
});

testApiBtn?.addEventListener("click", async () => {
  try {
    showCmdHint("測試中…");
    const r = await apiGet("/api/health");
    if (!r.ok) throw new Error(`health failed: ${r.status}`);
    showCmdHint(`連線成功：${r.data.gateway || "ok"}`, "success");
  } catch (e) {
    showCmdHint(String(e), "error");
  }
});

sendCmdBtn?.addEventListener("click", async () => {
  try {
    const agent = AGENTS.find((x) => x.id === selectedId);
    if (!agent) throw new Error("請先點選一個 agent");
    const text = (cmdText?.value || "").trim();
    if (!text) throw new Error("請輸入指令");

    showCmdHint("送出中…");
    const r = await apiPost("/api/command", { agent: agent.name, text });
    if (!r.ok || r.data.ok === false) {
      throw new Error(`command failed: ${r.status} ${JSON.stringify(r.data)}`);
    }

    pushLog(agent.name, `派工：${text}`);
    showCmdHint("已送出（等待 OpenClaw 回覆在 Discord/或你的回傳管線）", "success");
  } catch (e) {
    showCmdHint(String(e), "error");
  }
});

// Simulated updates every ~6s
setInterval(tick, 6000);
