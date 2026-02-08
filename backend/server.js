const express = require("express");
const client = require("prom-client");

const app = express();
const PORT = 3001;

/* =======================
   PROMETHEUS METRICS
======================= */
client.collectDefaultMetrics();

const httpCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["instance", "method", "route", "status"]
});

app.use((req, res, next) => {
  res.on("finish", () => {
    httpCounter.inc({
      instance: process.env.INSTANCE_NAME || "unknown",
      method: req.method,
      route: req.path,
      status: res.statusCode
    });
  });
  next();
});

/* =======================
   BASIC ENDPOINTS
======================= */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

/* =======================
   START SERVER
======================= */
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
