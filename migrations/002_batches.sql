CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  learner_type TEXT NOT NULL,
  sort INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS batch_members (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  messaged BOOLEAN NOT NULL DEFAULT FALSE,
  absent_today BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS batch_members_batch_idx ON batch_members (batch_id);

INSERT INTO batches (id, name, label, learner_type, sort, created_at)
VALUES
  ('SVB-SASI', 'SASI', '1st batch', 'student', 1, '2026-11-16T00:00:00Z'),
  ('SVB-WISE', 'WISE', '2nd batch', 'student', 2, '2026-11-16T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
