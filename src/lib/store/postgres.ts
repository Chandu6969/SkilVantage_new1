import crypto from "crypto";
import { Pool } from "pg";
import { hashToken } from "@/lib/security";
import { buildSeed } from "@/lib/store/seed";
import type { LeadStore } from "@/lib/store/types";
import type { AnalyticsEvent, Enquiry, FollowUp, Registration, Session, StoredFile } from "@/lib/types";

const SCHEMA = `
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
CREATE TABLE IF NOT EXISTS followups (
  id TEXT PRIMARY KEY,
  registration_id TEXT NOT NULL,
  follow_up_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  record JSONB NOT NULL
);
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
`;

const globalPool = globalThis as unknown as { skilVantagePool?: Pool };

function pool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (!globalPool.skilVantagePool) {
    globalPool.skilVantagePool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  }
  return globalPool.skilVantagePool;
}

export class PostgresStore implements LeadStore {
  kind = "postgres" as const;
  private ready: Promise<void> | null = null;

  private init() {
    if (!this.ready) {
      this.ready = (async () => {
        await pool().query(SCHEMA);
        const count = await pool().query<{ count: string }>("SELECT COUNT(*)::text AS count FROM registrations");
        if (count.rows[0]?.count === "0") {
          const seed = buildSeed();
          for (const record of seed.registrations) await this.insertRegistration(record);
          for (const record of seed.enquiries) await this.insertEnquiry(record);
          for (const record of seed.followups) await this.insertFollowUp(record);
          for (const event of seed.events) await this.recordEvent(event);
        }
      })().catch((error) => {
        this.ready = null;
        throw error;
      });
    }
    return this.ready;
  }

  async getSecret(name: string) {
    await this.init();
    const created = crypto.randomBytes(32).toString("hex");
    await pool().query("INSERT INTO app_meta (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING", [
      name,
      created,
    ]);
    const result = await pool().query<{ value: string }>("SELECT value FROM app_meta WHERE key = $1", [name]);
    return result.rows[0]!.value;
  }

  async insertRegistration(record: Registration) {
    await this.init();
    await pool().query(
      `INSERT INTO registrations (id, created_at, learner_type, program, status, email, sample, follow_up_date, record)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      [
        record.id,
        record.createdAt,
        record.learnerType,
        record.program,
        record.status,
        record.email,
        record.sample,
        record.followUpDate,
        JSON.stringify(record),
      ],
    );
  }

  async findRecentDuplicate(email: string, program: string) {
    await this.init();
    const result = await pool().query<{ record: Registration }>(
      `SELECT record FROM registrations
       WHERE lower(email) = lower($1) AND program = $2 AND sample = false
         AND created_at > NOW() - INTERVAL '24 hours'
       ORDER BY created_at DESC LIMIT 1`,
      [email, program],
    );
    return result.rows[0]?.record || null;
  }

  async getRegistration(id: string) {
    await this.init();
    const result = await pool().query<{ record: Registration }>("SELECT record FROM registrations WHERE id = $1", [id]);
    return result.rows[0]?.record || null;
  }

  async listRegistrations() {
    await this.init();
    const result = await pool().query<{ record: Registration }>(
      "SELECT record FROM registrations ORDER BY created_at DESC LIMIT 5000",
    );
    return result.rows.map((row) => row.record);
  }

  async updateRegistration(id: string, patch: Partial<Registration>) {
    await this.init();
    const current = await this.getRegistration(id);
    if (!current) return null;
    const next = { ...current, ...patch, id };
    await pool().query(
      `UPDATE registrations
       SET status = $2, email = $3, sample = $4, follow_up_date = $5, learner_type = $6, program = $7, record = $8::jsonb
       WHERE id = $1`,
      [id, next.status, next.email, next.sample, next.followUpDate, next.learnerType, next.program, JSON.stringify(next)],
    );
    return next;
  }

  async deleteRegistration(id: string) {
    await this.init();
    const current = await this.getRegistration(id);
    if (!current) return false;
    await pool().query("DELETE FROM followups WHERE registration_id = $1", [id]);
    if (current.resumeFileId) await pool().query("DELETE FROM files WHERE id = $1", [current.resumeFileId]);
    await pool().query("DELETE FROM registrations WHERE id = $1", [id]);
    return true;
  }

  async insertEnquiry(record: Enquiry) {
    await this.init();
    await pool().query(
      `INSERT INTO enquiries (id, created_at, status, sample, record) VALUES ($1,$2,$3,$4,$5::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      [record.id, record.createdAt, record.status, record.sample, JSON.stringify(record)],
    );
  }

  async listEnquiries() {
    await this.init();
    const result = await pool().query<{ record: Enquiry }>("SELECT record FROM enquiries ORDER BY created_at DESC LIMIT 5000");
    return result.rows.map((row) => row.record);
  }

  async updateEnquiry(id: string, patch: Partial<Enquiry>) {
    await this.init();
    const result = await pool().query<{ record: Enquiry }>("SELECT record FROM enquiries WHERE id = $1", [id]);
    const current = result.rows[0]?.record;
    if (!current) return null;
    const next = { ...current, ...patch, id };
    await pool().query("UPDATE enquiries SET status = $2, sample = $3, record = $4::jsonb WHERE id = $1", [
      id,
      next.status,
      next.sample,
      JSON.stringify(next),
    ]);
    return next;
  }

  async insertFollowUp(record: FollowUp) {
    await this.init();
    await pool().query(
      `INSERT INTO followups (id, registration_id, follow_up_date, created_at, record)
       VALUES ($1,$2,$3,$4,$5::jsonb) ON CONFLICT (id) DO NOTHING`,
      [record.id, record.registrationId, record.followUpDate, record.createdAt, JSON.stringify(record)],
    );
  }

  async listFollowUps() {
    await this.init();
    const result = await pool().query<{ record: FollowUp }>(
      "SELECT record FROM followups ORDER BY created_at DESC LIMIT 5000",
    );
    return result.rows.map((row) => row.record);
  }

  async recordEvent(event: AnalyticsEvent) {
    await this.init();
    await pool().query(
      `INSERT INTO analytics_events
        (id, created_at, event_type, path, course, learner_type, device, source, visitor_id, sample)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
      [
        event.id,
        event.createdAt,
        event.eventType,
        event.path,
        event.course,
        event.learnerType,
        event.device,
        event.source,
        event.visitorId,
        event.sample,
      ],
    );
    await pool().query(
      `DELETE FROM analytics_events WHERE id IN (
         SELECT id FROM analytics_events ORDER BY created_at DESC OFFSET 8000
       )`,
    );
  }

  async listEventsSince(iso: string) {
    await this.init();
    const result = await pool().query<{
      id: string;
      created_at: Date;
      event_type: AnalyticsEvent["eventType"];
      path: string;
      course: string | null;
      learner_type: string | null;
      device: AnalyticsEvent["device"];
      source: string | null;
      visitor_id: string | null;
      sample: boolean;
    }>(
      `SELECT id, created_at, event_type, path, course, learner_type, device, source, visitor_id, sample
       FROM analytics_events WHERE created_at >= $1 ORDER BY created_at DESC LIMIT 8000`,
      [iso],
    );
    return result.rows.map((row) => ({
      id: row.id,
      createdAt: new Date(row.created_at).toISOString(),
      eventType: row.event_type,
      path: row.path,
      course: row.course,
      learnerType: row.learner_type,
      device: row.device,
      source: row.source,
      visitorId: row.visitor_id,
      sample: row.sample,
    }));
  }

  async saveFile(file: StoredFile, bytes: Buffer) {
    await this.init();
    const total = await pool().query<{ count: string; bytes: string }>(
      "SELECT COUNT(*)::text AS count, COALESCE(SUM(size),0)::text AS bytes FROM files",
    );
    if (Number(total.rows[0]?.count || 0) >= 200 || Number(total.rows[0]?.bytes || 0) + bytes.length > 200 * 1024 * 1024) {
      throw new Error("File storage is full.");
    }
    await pool().query(
      `INSERT INTO files (id, filename, mime, size, created_at, data) VALUES ($1,$2,$3,$4,$5,$6)`,
      [file.id, file.filename, file.mime, file.size, file.createdAt, bytes],
    );
  }

  async getFile(id: string) {
    await this.init();
    const result = await pool().query<{ filename: string; mime: string; size: number; created_at: Date; data: Buffer }>(
      "SELECT filename, mime, size, created_at, data FROM files WHERE id = $1",
      [id],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      id,
      filename: row.filename,
      mime: row.mime,
      size: row.size,
      createdAt: new Date(row.created_at).toISOString(),
      data: row.data,
    };
  }

  async deleteFile(id: string) {
    await this.init();
    await pool().query("DELETE FROM files WHERE id = $1", [id]);
  }

  async createSession(role: Session["role"]) {
    await this.init();
    const token = crypto.randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    await pool().query("DELETE FROM sessions WHERE expires_at < NOW()");
    await pool().query("INSERT INTO sessions (token_hash, role, expires_at) VALUES ($1,$2,$3)", [
      hashToken(token),
      role,
      expiresAt,
    ]);
    return { token, expiresAt };
  }

  async getSession(token: string) {
    await this.init();
    const result = await pool().query<{ role: Session["role"]; expires_at: Date }>(
      "SELECT role, expires_at FROM sessions WHERE token_hash = $1",
      [hashToken(token)],
    );
    const row = result.rows[0];
    if (!row) return null;
    if (new Date(row.expires_at).getTime() <= Date.now()) {
      await this.deleteSession(token);
      return null;
    }
    return { role: row.role, expiresAt: new Date(row.expires_at).toISOString() };
  }

  async deleteSession(token: string) {
    await this.init();
    await pool().query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
  }
}
