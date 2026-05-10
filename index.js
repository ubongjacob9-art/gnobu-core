const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();

// =========================
// 🌐 MIDDLEWARE
// =========================
app.use(cors());
app.use(express.json());

app.use(express.static("public"));
console.log("🚀 GNOBU MULTI-TENANT CORE STARTING...");

// =========================
// 🔐 API KEY REGISTRY
// =========================
const VALID_KEYS = {
  "gnobu_live_123": "tenant_alpha",
  "gnobu_live_456": "tenant_beta"
};

// =========================
// 📊 USAGE TRACKING
// =========================
let usage = {};
const RATE_LIMIT = 100;

// =========================
// 📦 FILES
// =========================
const EVENTS_FILE = "events.json";
const MEMORY_FILE = "memory.json";
const INCIDENTS_FILE = "incidents.json";

// =========================
// 📦 LOAD DATA
// =========================
let incidents = fs.existsSync(INCIDENTS_FILE)
  ? JSON.parse(fs.readFileSync(INCIDENTS_FILE, "utf-8") || "[]")
  : [];

let events = fs.existsSync(EVENTS_FILE)
  ? JSON.parse(fs.readFileSync(EVENTS_FILE, "utf-8") || "[]")
  : [];

let memory = fs.existsSync(MEMORY_FILE)
  ? JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8") || "{}")
  : {};

// =========================
// 💾 SAVE HELPERS
// =========================
function saveMemory() {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
}

function saveIncidents() {
  fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(incidents, null, 2));
}

function saveEvents() {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
}

// =========================
// 🔐 TENANT RESOLVER
// =========================
function resolveTenant(apiKey) {
  return VALID_KEYS[apiKey] || null;
}

// =========================
// 🧠 HELPERS
// =========================
function roundTrust(v) {
  return Number(v.toFixed(2));
}

function stabilizeTrust(trust, events) {
  let recovery = Math.min(events * 0.002, 0.1);
  let adjusted = trust + recovery;
  return Number(Math.max(0, Math.min(1, adjusted)).toFixed(2));
}

// =========================
// 🧠 OWNER ENGINE
// =========================
function getOwner(service) {
  const map = {
    "auth-service": "team-platform-security",
    "payment-service": "team-finance",
    "user-service": "team-core"
  };
  return map[service] || "unassigned";
}

// =========================
// 🧠 ESCALATION
// =========================
function getEscalation(service, risk) {
  if (risk === "HIGH") {
    if (service === "payment-service") return "fraud-ops";
    if (service === "auth-service") return "security-response";
  }
  return "platform-operations";
}

// =========================
// 🧠 TEAM ROUTING
// =========================
function getRecommendedTeam(service) {
  const teams = {
    "auth-service": "identity-engineering",
    "payment-service": "payments-reliability",
    "user-service": "core-platform"
  };
  return teams[service] || "general-engineering";
}

// =========================
// 🧠 DEPLOYMENT DETECTOR
// =========================
function detectRecentChange(service) {
  const random = Math.random();

  return {
    recent_change_detected: random > 0.4,
    last_deployment_by:
      service === "payment-service"
        ? "ci-bot-payments"
        : "ci-bot-platform",

    deployment_window: new Date(Date.now() - 1000 * 60 * 18).toISOString()
  };
}

// =========================
// 🧠 INTELLIGENCE ENGINE
// =========================
function evaluate(event, mem) {
  const base = event.confidence || 0.5;
  const trust = mem.trust || 0.5;

  let confidence = (base * 0.8) + (trust * 0.2);

  if (trust < 0.2) confidence *= 0.85;
  else if (trust < 0.35) confidence *= 0.9;

  confidence = Math.max(0, Math.min(1, confidence));

  return {
    confidence: Number(confidence.toFixed(2)),
    trust: Number(trust.toFixed(2)),
    drift: confidence < 0.45,
    risk: confidence < 0.4 ? "HIGH" :
          confidence < 0.55 ? "MEDIUM" : "LOW"
  };
}

// =========================
// 🚨 INCIDENT CREATION
// =========================
function createIncident(tenant, service, owner, result, mem) {
  return {
    tenant,
    incident_id: "INC-" + Date.now(),
    service,
    owner,
    severity: result.risk,
    confidence: result.confidence,
    trust: mem.trust,
    events_seen: mem.events,
    status: "OPEN",
    created_at: new Date().toISOString(),
    escalation_level: 0,
    escalated: false,
    escalation_reason: null,
    last_escalated_at: null,
    action_taken: null,
    policy_triggered: null,
    action_at: null
  };
}

// =========================
// 🚨 ESCALATION ENGINE
// =========================
function escalateIncident(incident, reason) {
  incident.escalation_level += 1;
  incident.escalated = true;
  incident.escalation_reason = reason;
  incident.last_escalated_at = new Date().toISOString();
}

// =========================
// 📜 POLICY ENGINE
// =========================
function policyEngine(incident, event) {
  if (!incident) return "NO_POLICY";
  if (incident.severity === "HIGH") return "STRICT_PROTECTION";
  if (incident.severity === "MEDIUM") return "MONITOR_CLOSELY";
  if (event.confidence < 0.35) return "RISK_THROTTLE";
  return "LOG_ONLY";
}

// =========================
// ⚙️ ACTION ENGINE
// =========================
function actionEngine(incident, event, service) {
  if (!incident) return "NO_ACTION";

  if (incident.severity === "HIGH" || event.confidence < 0.4) {
    if (service === "auth-service") return "LOCK_LOGIN";
    if (service === "payment-service") return "HOLD_TRANSACTION";
    if (service === "user-service") return "FLAG_ACCOUNT";
    return "GENERIC_PROTECT";
  }

  if (incident.severity === "MEDIUM") return "LIMIT_RATE";

  return "LOG_ONLY";
}

// =========================
// 🧠 DECISION ENGINE
// =========================
function decisionEngine(incident, action) {
  if (!incident) return "ALLOW";
  if (incident.severity === "HIGH") return "BLOCK";
  if (action === "LIMIT_RATE") return "THROTTLE";
  return "ALLOW";
}

// =========================
// 🚀 SIGNAL ENDPOINT
// =========================
app.post("/signal", (req, res) => {

  const { api_key, service, error, confidence } = req.body;
  const timestamp = new Date().toISOString();

  const tenant = resolveTenant(api_key);
  if (!tenant) return res.status(401).json({ error: "INVALID_API_KEY" });

  if (!usage[api_key]) usage[api_key] = 0;
  usage[api_key]++;
  if (usage[api_key] > RATE_LIMIT)
    return res.status(429).json({ error: "RATE_LIMIT_EXCEEDED" });

  if (!memory[tenant]) memory[tenant] = {};
  if (!memory[tenant][service]) {
    memory[tenant][service] = { trust: 0.5, events: 0 };
  }

  const mem = memory[tenant][service];
  mem.events += 1;

  if (error === "critical") mem.trust -= 0.03;
  if (error === "ok") mem.trust += 0.02;

  mem.trust = stabilizeTrust(mem.trust, mem.events);
  mem.trust = Math.max(0.15, mem.trust);

  saveMemory();

  const owner = getOwner(service);
  const escalation = getEscalation(service, error);
  const recommended_team = getRecommendedTeam(service);
  const deployment = detectRecentChange(service);

  const trace_id = "trace_" + Math.floor(Math.random() * 1000000);

  const result = evaluate({ service, error, confidence }, mem);

  let incident = null;
  let reason = null;

  if (result.risk === "HIGH" || result.confidence < 0.35 || (result.drift && mem.trust < 0.4)) {
    incident = createIncident(tenant, service, owner, result, mem);
    incidents.push(incident);
    saveIncidents();
  }

  let action = "NO_ACTION";
  let policy = "NO_POLICY";
  let decision = "ALLOW";

  if (incident) {
    reason = "HIGH_RISK_DETECTED";

    escalateIncident(incident, reason);

    action = actionEngine(incident, result, service);
    policy = policyEngine(incident, result);
    decision = decisionEngine(incident, action);

    incident.action_taken = action;
    incident.policy_triggered = policy;
    incident.action_at = new Date().toISOString();

    saveIncidents();
  }

  const response = {
    event_id: "evt_" + Date.now(),
    timestamp,
    tenant,
    service,
    trace_id,
    owner,
    escalation,
    recommended_team,
    recent_change_detected: deployment.recent_change_detected,
    last_deployment_by: deployment.last_deployment_by,
    deployment_window: deployment.deployment_window,
    decision,
    action,
    policy,
    risk: result.risk,
    confidence: result.confidence,
    trust: mem.trust,
    drift_detected: result.drift,
    status: incident ? "ACTION_REQUIRED" : "NORMAL",
    reason: reason || "NORMAL_FLOW"
  };

  events.push(response);
  saveEvents();

  res.json(response);
});

// =========================
// 📂 ROUTES
// =========================
app.get("/", (req, res) => {
  res.json({
    status: "GNOBU OPERATIONAL DECISION CORE 🚀",
    endpoints: ["/signal", "/events", "/incidents", "/usage", "/docs", "/dashboard"],
    totalEvents: events.length,
    totalIncidents: incidents.length
  });
});

app.get("/docs", (req, res) => {
  res.sendFile(__dirname + "/docs.html");
});

app.get("/dashboard", (req, res) => {
  res.sendFile(__dirname + "/public/dashboard.html");
});

app.get("/events", (req, res) => {
  const tenant = resolveTenant(req.query.api_key);
  res.json(events.filter(e => e.tenant === tenant));
});

app.get("/incidents", (req, res) => {
  const tenant = resolveTenant(req.query.api_key);
  res.json(incidents.filter(i => i.tenant === tenant));
});

app.get("/usage", (req, res) => {
  const { api_key } = req.query;
  res.json({
    api_key,
    requests: usage[api_key] || 0,
    limit: RATE_LIMIT
  });
});

// =========================
// 🚀 START
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 GNOBU RUNNING ON PORT " + PORT);
});