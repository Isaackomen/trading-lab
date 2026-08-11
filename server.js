const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;
const EXNESS_REFERRAL_URL = process.env.EXNESS_REFERRAL_URL || "https://one.exnessonelink.com/a/7hlsl0wdx2";

const db = new Database("tradinglab.db");
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event TEXT NOT NULL,
    source TEXT,
    referrer TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    source TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

app.use(express.json());
app.use(express.static(__dirname));
function record(event, req, source) {
  db.prepare(`
    INSERT INTO events (event, source, referrer, user_agent)
    VALUES (?, ?, ?, ?)
  `).run(
    event,
    source || null,
    req.get("referer") || null,
    req.get("user-agent") || null
  );
}

app.post("/api/event", (req, res) => {
  const allowed = new Set(["page_view", "start_learning_click", "exness_click"]);
  if (!allowed.has(req.body.event)) return res.status(400).json({ error: "Invalid event" });
  record(req.body.event, req, req.body.source);
  res.json({ ok: true });
});

app.post("/api/signup", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const source = String(req.body.source || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  try {
    db.prepare("INSERT INTO signups (email, source) VALUES (?, ?)").run(email, source || null);
    record("signup", req, source);
    res.json({ ok: true });
  } catch (e) {
    if (String(e.message).includes("UNIQUE")) {
      return res.status(409).json({ error: "You're already signed up." });
    }
    res.status(500).json({ error: "Could not save signup." });
  }
});

app.get("/go/exness", (req, res) => {
  record("exness_click", req, req.query.source || "unknown");
  if (EXNESS_REFERRAL_URL.includes("PASTE_YOUR")) {
    return res.status(503).send("Add your Exness referral URL to EXNESS_REFERRAL_URL before using this redirect.");
  }
  res.redirect(EXNESS_REFERRAL_URL);
});

app.get("/api/admin/stats", (req, res) => {
  // Protect this endpoint before deploying publicly.
  const events = db.prepare(`
    SELECT event, COUNT(*) AS count
    FROM events GROUP BY event ORDER BY count DESC
  `).all();

  const signups = db.prepare("SELECT COUNT(*) AS count FROM signups").get().count;
  const today = db.prepare(`
    SELECT event, COUNT(*) AS count FROM events
    WHERE date(created_at) = date('now')
    GROUP BY event
  `).all();

  res.json({ events, signups, today });
});

app.listen(PORT, () => {
  console.log(`Trading Lab running at http://localhost:${PORT}`);
});
