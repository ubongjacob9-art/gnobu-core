const axios = require("axios");

async function runDemo() {
  console.log("🚨 Sending event to Gnobu...\n");

  try {
    const response = await axios.post(
      "http://localhost:3000/signal",
      {
        api_key: "gnobu_live_123",
        service: "payment-service",
        error: "critical",
        confidence: 0.28
      }
    );

    const data = response.data;

    console.log("✅ Gnobu Response:");
    console.log(data);

    console.log("\n🧠 Executing Operational Decision...\n");

    if (data.decision === "BLOCK") {
      console.log("🚫 Transaction blocked.");
    }

    if (data.action === "HOLD_TRANSACTION") {
      console.log("⏸ Holding payment for review.");
    }

    if (data.policy === "STRICT_PROTECTION") {
      console.log("🔐 Strict protection policy activated.");
    }

  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

runDemo();