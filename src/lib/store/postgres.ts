import crypto from "crypto";
import { Pool } from "pg";
import { STARTER_BATCHES, ordinalLabel } from "@/lib/batches";
import { batchId, facultyPayId } from "@/lib/ids";
import { hashToken } from "@/lib/security";
import { buildSeed } from "@/lib/store/seed";
import type { LeadStore } from "@/lib/store/types";
import type { AnalyticsEvent, AttendanceMark, BatchMember, ClassAssignment, Enquiry, Faculty, FacultyDay, FacultyPay, FeePayment, FollowUp, LearnerType, Registration, Session, StoredFile, TeacherNote, TrainingBatch } from "@/lib/types";

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
CREATE TABLE IF NOT EXISTS desk_items (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  batch_id TEXT NOT NULL DEFAULT '',
  member_id TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL,
  record JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS desk_items_kind_idx ON desk_items (kind, batch_id);
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

  private async ensureBatches() {
    await this.init();
    for (const starter of STARTER_BATCHES) {
      await pool().query(
        `INSERT INTO batches (id, name, label, learner_type, sort, created_at)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
        [starter.id, starter.name, starter.label, starter.learnerType, starter.sort, starter.createdAt],
      );
    }
  }

  private mapBatch(row: { id: string; name: string; label: string; learner_type: LearnerType; sort: number; created_at: Date | string }): TrainingBatch {
    return {
      id: row.id,
      name: row.name,
      label: row.label,
      learnerType: row.learner_type,
      sort: row.sort,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  private mapMember(row: {
    id: string;
    batch_id: string;
    full_name: string;
    phone: string;
    email: string;
    note: string;
    messaged: boolean;
    absent_today: boolean;
    created_at: Date | string;
  }): BatchMember {
    return {
      id: row.id,
      batchId: row.batch_id,
      fullName: row.full_name,
      phone: row.phone,
      email: row.email,
      note: row.note,
      messaged: row.messaged,
      absentToday: row.absent_today,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  async listBatches(learnerType?: LearnerType) {
    await this.ensureBatches();
    const result = learnerType
      ? await pool().query("SELECT * FROM batches WHERE learner_type = $1 ORDER BY sort ASC, name ASC", [learnerType])
      : await pool().query("SELECT * FROM batches ORDER BY sort ASC, name ASC");
    return result.rows.map((row) => this.mapBatch(row));
  }

  async getBatch(id: string) {
    await this.ensureBatches();
    const result = await pool().query("SELECT * FROM batches WHERE id = $1", [id]);
    return result.rows[0] ? this.mapBatch(result.rows[0]) : null;
  }

  async createBatch(input: { name: string; learnerType: LearnerType }) {
    await this.ensureBatches();
    const name = input.name.trim();
    const existing = await pool().query("SELECT * FROM batches WHERE learner_type = $1 AND lower(name) = lower($2)", [
      input.learnerType,
      name,
    ]);
    if (existing.rows[0]) return this.mapBatch(existing.rows[0]);
    const max = await pool().query<{ sort: number }>("SELECT COALESCE(MAX(sort), 0)::int AS sort FROM batches WHERE learner_type = $1", [
      input.learnerType,
    ]);
    const sort = (max.rows[0]?.sort || 0) + 1;
    const batch: TrainingBatch = {
      id: batchId(),
      name,
      label: ordinalLabel(sort),
      learnerType: input.learnerType,
      sort,
      createdAt: new Date().toISOString(),
    };
    await pool().query(
      `INSERT INTO batches (id, name, label, learner_type, sort, created_at) VALUES ($1,$2,$3,$4,$5,$6)`,
      [batch.id, batch.name, batch.label, batch.learnerType, batch.sort, batch.createdAt],
    );
    return batch;
  }

  async listMembers(batchId: string) {
    await this.init();
    const result = await pool().query("SELECT * FROM batch_members WHERE batch_id = $1 ORDER BY full_name ASC", [batchId]);
    return result.rows.map((row) => this.mapMember(row));
  }

  async addMember(member: BatchMember) {
    await this.init();
    await pool().query(
      `INSERT INTO batch_members (id, batch_id, full_name, phone, email, note, messaged, absent_today, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [member.id, member.batchId, member.fullName, member.phone, member.email, member.note, member.messaged, member.absentToday, member.createdAt],
    );
  }

  async updateMember(id: string, patch: Partial<Pick<BatchMember, "messaged" | "absentToday">>) {
    await this.init();
    const current = await pool().query("SELECT * FROM batch_members WHERE id = $1", [id]);
    if (!current.rows[0]) return null;
    const messaged = patch.messaged ?? current.rows[0].messaged;
    const absent = patch.absentToday ?? current.rows[0].absent_today;
    const result = await pool().query("UPDATE batch_members SET messaged = $2, absent_today = $3 WHERE id = $1 RETURNING *", [
      id,
      messaged,
      absent,
    ]);
    return result.rows[0] ? this.mapMember(result.rows[0]) : null;
  }

  async resetMessaged(batchId: string) {
    await this.init();
    await pool().query("UPDATE batch_members SET messaged = FALSE WHERE batch_id = $1", [batchId]);
  }

  private async deskRows<T>(kind: string, batchId?: string) {
    await this.init();
    const result = batchId
      ? await pool().query<{ record: T }>("SELECT record FROM desk_items WHERE kind = $1 AND batch_id = $2 ORDER BY created_at DESC", [kind, batchId])
      : await pool().query<{ record: T }>("SELECT record FROM desk_items WHERE kind = $1 ORDER BY created_at DESC", [kind]);
    return result.rows.map((row) => row.record);
  }

  async listAttendance(batchId: string) {
    const rows = await this.deskRows<AttendanceMark>("attendance", batchId);
    return rows.sort((a, b) => b.date.localeCompare(a.date));
  }

  async markAttendance(mark: AttendanceMark) {
    await this.init();
    await pool().query(
      "DELETE FROM desk_items WHERE kind = 'attendance' AND batch_id = $1 AND member_id = $2 AND record->>'date' = $3",
      [mark.batchId, mark.memberId, mark.date],
    );
    await pool().query(
      "INSERT INTO desk_items (id, kind, batch_id, member_id, created_at, record) VALUES ($1,'attendance',$2,$3,$4,$5::jsonb)",
      [mark.id, mark.batchId, mark.memberId, mark.createdAt, JSON.stringify(mark)],
    );
    return mark;
  }

  async listFees() {
    const rows = await this.deskRows<FeePayment>("fee");
    return rows.sort((a, b) => b.paidOn.localeCompare(a.paidOn) || b.createdAt.localeCompare(a.createdAt));
  }

  async addFee(fee: FeePayment) {
    await this.init();
    await pool().query(
      "INSERT INTO desk_items (id, kind, batch_id, member_id, created_at, record) VALUES ($1,'fee',$2,$3,$4,$5::jsonb)",
      [fee.id, fee.batchId, fee.memberId, fee.createdAt, JSON.stringify(fee)],
    );
  }

  async listAssignments(batchId?: string) {
    return this.deskRows<ClassAssignment>("assignment", batchId);
  }

  async addAssignment(item: ClassAssignment) {
    await this.init();
    await pool().query(
      "INSERT INTO desk_items (id, kind, batch_id, member_id, created_at, record) VALUES ($1,'assignment',$2,$3,$4,$5::jsonb)",
      [item.id, item.batchId, item.memberId, item.createdAt, JSON.stringify(item)],
    );
  }

  async updateAssignment(id: string, status: ClassAssignment["status"]) {
    await this.init();
    const current = await pool().query<{ record: ClassAssignment }>("SELECT record FROM desk_items WHERE id = $1 AND kind = 'assignment'", [id]);
    const item = current.rows[0]?.record;
    if (!item) return null;
    item.status = status;
    await pool().query("UPDATE desk_items SET record = $2::jsonb WHERE id = $1", [id, JSON.stringify(item)]);
    return item;
  }

  async listTeacherNotes(batchId?: string) {
    return this.deskRows<TeacherNote>("teacher", batchId);
  }

  async addTeacherNote(note: TeacherNote) {
    await this.init();
    await pool().query(
      "INSERT INTO desk_items (id, kind, batch_id, member_id, created_at, record) VALUES ($1,'teacher',$2,'',$3,$4::jsonb)",
      [note.id, note.batchId, note.createdAt, JSON.stringify(note)],
    );
  }

  private async putDesk(kind: string, id: string, memberId: string, createdAt: string, record: unknown) {
    await pool().query(
      "INSERT INTO desk_items (id, kind, batch_id, member_id, created_at, record) VALUES ($1,$2,'',$3,$4,$5::jsonb)",
      [id, kind, memberId, createdAt, JSON.stringify(record)],
    );
  }

  async listFaculty() {
    const rows = await this.deskRows<Faculty>("faculty");
    return rows.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  async addFaculty(person: Faculty) {
    await this.init();
    await this.putDesk("faculty", person.id, person.id, person.createdAt, person);
  }

  async listFacultyDays() {
    const rows = await this.deskRows<FacultyDay>("faculty-day");
    return rows.sort((a, b) => b.date.localeCompare(a.date));
  }

  async markFacultyDay(day: FacultyDay) {
    await this.init();
    await pool().query("DELETE FROM desk_items WHERE kind = 'faculty-day' AND member_id = $1 AND record->>'date' = $2", [day.teacherId, day.date]);
    await this.putDesk("faculty-day", day.id, day.teacherId, day.createdAt, day);
    const teachers = await this.deskRows<Faculty>("faculty");
    const teacher = teachers.find((item) => item.id === day.teacherId);
    const pays = await this.deskRows<FacultyPay>("faculty-pay");
    const existing = pays.find((item) => item.teacherId === day.teacherId && item.classDate === day.date);
    if (day.status === "absent") {
      if (existing?.status === "due") await pool().query("DELETE FROM desk_items WHERE id = $1", [existing.id]);
    } else if (teacher && teacher.rate > 0 && !existing) {
      const pay: FacultyPay = {
        id: facultyPayId(),
        teacherId: day.teacherId,
        amount: teacher.rate,
        classDate: day.date,
        paidOn: "",
        status: "due",
        note: "Class pay",
        createdAt: day.createdAt,
      };
      await this.putDesk("faculty-pay", pay.id, pay.teacherId, pay.createdAt, pay);
    }
    return day;
  }

  async listFacultyPays() {
    const rows = await this.deskRows<FacultyPay>("faculty-pay");
    return rows.sort((a, b) => b.classDate.localeCompare(a.classDate) || b.createdAt.localeCompare(a.createdAt));
  }

  async saveFacultyPay(pay: FacultyPay) {
    await this.init();
    const pays = await this.deskRows<FacultyPay>("faculty-pay");
    const existing = pays.find((item) => item.teacherId === pay.teacherId && item.classDate === pay.classDate);
    if (existing) {
      existing.amount = pay.amount;
      existing.status = pay.status;
      existing.note = pay.note || existing.note;
      existing.paidOn = pay.paidOn;
      await pool().query("UPDATE desk_items SET record = $2::jsonb WHERE id = $1", [existing.id, JSON.stringify(existing)]);
      return existing;
    }
    await this.putDesk("faculty-pay", pay.id, pay.teacherId, pay.createdAt, pay);
    return pay;
  }

  async settleFacultyPay(id: string, paidOn: string) {
    await this.init();
    const current = await pool().query<{ record: FacultyPay }>("SELECT record FROM desk_items WHERE id = $1 AND kind = 'faculty-pay'", [id]);
    const item = current.rows[0]?.record;
    if (!item) return null;
    item.status = "paid";
    item.paidOn = paidOn;
    await pool().query("UPDATE desk_items SET record = $2::jsonb WHERE id = $1", [id, JSON.stringify(item)]);
    return item;
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
