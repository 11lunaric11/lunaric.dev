-- lunaric.dev — D1 schema

CREATE TABLE IF NOT EXISTS views (
  slug  TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS guestbook (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  name    TEXT NOT NULL,
  message TEXT NOT NULL,
  created TEXT NOT NULL DEFAULT (datetime('now'))
);

-- self-hosted page-view analytics (client beacon -> /api/hit)
CREATE TABLE IF NOT EXISTS hits (
  path  TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);

-- request monitor (private /dashboard, gated by Cloudflare Access)
CREATE TABLE IF NOT EXISTS requests (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  ts      TEXT NOT NULL DEFAULT (datetime('now')),
  method  TEXT,
  path    TEXT,
  status  INTEGER,
  country TEXT,
  ip      TEXT,
  ua      TEXT,
  threat  TEXT
);

-- fixed-window rate limiter (per-IP keys)
CREATE TABLE IF NOT EXISTS ratelimit (
  k      TEXT PRIMARY KEY,
  count  INTEGER NOT NULL,
  window INTEGER NOT NULL
);
