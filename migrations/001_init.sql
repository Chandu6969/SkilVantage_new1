CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL,
  learner_type TEXT NOT NULL,
  program TEXT NOT NULL,
  status TEXT NOT NULL,
  email TEXT NOT NULL,
  sample BOOLEAN NOT NULL DEFAULT FALSE,
  follow_up_date DATE,
  record JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS registrations_created_idx ON registrations (created_at DESC);
CREATE INDEX IF NOT EXISTS registrations_program_idx ON registrations (program);
CREATE INDEX IF NOT EXISTS registrations_status_idx ON registrations (status);
CREATE INDEX IF NOT EXISTS registrations_email_idx ON registrations (email);

CREATE TABLE IF NOT EXISTS enquiries (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  sample BOOLEAN NOT NULL DEFAULT FALSE,
  record JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS enquiries_created_idx ON enquiries (created_at DESC);

CREATE TABLE IF NOT EXISTS followups (
  id TEXT PRIMARY KEY,
  registration_id TEXT NOT NULL,
  follow_up_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  record JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS followups_registration_idx ON followups (registration_id);

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL,
  path TEXT NOT NULL,
  course TEXT,
  learner_type TEXT,
  device TEXT NOT NULL,
  source TEXT,
  visitor_id TEXT,
  sample BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS analytics_created_idx ON analytics_events (created_at DESC);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  data BYTEA NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
