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

// Simulated updates every ~6s
setInterval(tick, 6000);
