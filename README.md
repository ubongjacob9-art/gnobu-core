# Gnobu — Operational Decision Infrastructure

Gnobu is an Operational Decision Layer for Distributed Systems.

Instead of only detecting events or logging incidents, Gnobu evaluates system signals and returns structured operational decisions in real time.

---

## 🚨 Problem

Modern systems split responsibility across:
- Monitoring (Datadog, Prometheus)
- Logging (ELK, Splunk)
- Alerting (PagerDuty)
- Response (humans)

This creates delay between:
**event → interpretation → decision → action**

---

## ⚙️ Solution

Gnobu introduces a decision layer between detection and response.

It processes operational signals and returns:

- risk score
- trust score
- ownership routing
- escalation path
- system action
- policy enforcement

---

## 🔌 Core Endpoint

### POST /signal

```json
{
  "api_key": "gnobu_live_123",
  "service": "payment-service",
  "error": "critical",
  "confidence": 0.21
}
📤 Example Response
JSON
{
  "decision": "BLOCK",
  "action": "HOLD_TRANSACTION",
  "policy": "STRICT_PROTECTION",
  "risk": "HIGH",
  "confidence": 0.24,
  "reason": "HIGH_RISK_DETECTED"
}
📊 System Capabilities
Operational decision automation
Incident generation & escalation
Ownership routing
Trust scoring engine
Deployment-aware reasoning
Multi-tenant architecture
🧠 Philosophy
Gnobu is not monitoring.
Gnobu is decision infrastructure for distributed systems.