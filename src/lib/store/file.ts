import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { hashToken } from "@/lib/security";
import { buildSeed } from "@/lib/store/seed";
import type { LeadStore } from "@/lib/store/types";
import type { AnalyticsEvent, Enquiry, FollowUp, Registration, Session, StoredFile } from "@/lib/types";

interface FileBody {
  meta: Record<string, string>;
  registrations: Registration[];
  enquiries: Enquiry[];
  followups: FollowUp[];
  events: AnalyticsEvent[];
  files: (StoredFile & { data: string })[];
  sessions: { tokenHash: string; role: Session["role"]; expiresAt: string }[];
}

function emptyBody(): FileBody {
  return { meta: {}, registrations: [], enquiries: [], followups: [], events: [], files: [], sessions: [] };
}

export class FileStore implements LeadStore {
  kind = "file" as const;
  private queue: Promise<unknown> = Promise.resolve();

  private dir() {
    return process.env.DATA_DIR || path.join(process.cwd(), "data");
  }

  private file() {
    return path.join(this.dir(), "store.json");
  }

  private async locked<T>(fn: () => Promise<T>) {
    const run = this.queue.then(fn, fn);
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async read(): Promise<FileBody> {
    try {
      const raw = await fs.readFile(this.file(), "utf8");
      const parsed = JSON.parse(raw) as FileBody;
      parsed.meta ||= {};
      parsed.registrations ||= [];
      parsed.enquiries ||= [];
      parsed.followups ||= [];
      parsed.events ||= [];
      parsed.files ||= [];
      parsed.sessions ||= [];
      return parsed;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const seeded = emptyBody();
      const seed = buildSeed();
      seeded.registrations = seed.registrations;
      seeded.enquiries = seed.enquiries;
      seeded.followups = seed.followups;
      seeded.events = seed.events;
      await this.write(seeded);
      return seeded;
    }
  }

  private async write(body: FileBody) {
    await fs.mkdir(this.dir(), { recursive: true });
    const temp = path.join(this.dir(), `store.${process.pid}.tmp`);
    await fs.writeFile(temp, JSON.stringify(body));
    await fs.rename(temp, this.file());
  }

  async getSecret(name: string) {
    return this.locked(async () => {
      const body = await this.read();
      if (!body.meta[name]) {
        body.meta[name] = crypto.randomBytes(32).toString("hex");
        await this.write(body);
      }
      return body.meta[name];
    });
  }

  async insertRegistration(record: Registration) {
    await this.locked(async () => {
      const body = await this.read();
      body.registrations.push(record);
      await this.write(body);
    });
  }

  async findRecentDuplicate(email: string, program: string) {
    const body = await this.read();
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return (
      body.registrations.find(
        (item) =>
          !item.sample &&
          item.email.toLowerCase() === email.toLowerCase() &&
          item.program === program &&
          new Date(item.createdAt).getTime() >= cutoff,
      ) || null
    );
  }

  async getRegistration(id: string) {
    const body = await this.read();
    return body.registrations.find((item) => item.id === id) || null;
  }

  async listRegistrations() {
    const body = await this.read();
    return body.registrations;
  }

  async updateRegistration(id: string, patch: Partial<Registration>) {
    return this.locked(async () => {
      const body = await this.read();
      const index = body.registrations.findIndex((item) => item.id === id);
      if (index < 0) return null;
      body.registrations[index] = { ...body.registrations[index]!, ...patch, id };
      await this.write(body);
      return body.registrations[index]!;
    });
  }

  async deleteRegistration(id: string) {
    return this.locked(async () => {
      const body = await this.read();
      const current = body.registrations.find((item) => item.id === id);
      if (!current) return false;
      body.registrations = body.registrations.filter((item) => item.id !== id);
      body.followups = body.followups.filter((item) => item.registrationId !== id);
      if (current.resumeFileId) body.files = body.files.filter((item) => item.id !== current.resumeFileId);
      await this.write(body);
      return true;
    });
  }

  async insertEnquiry(record: Enquiry) {
    await this.locked(async () => {
      const body = await this.read();
      body.enquiries.push(record);
      await this.write(body);
    });
  }

  async listEnquiries() {
    return (await this.read()).enquiries;
  }

  async updateEnquiry(id: string, patch: Partial<Enquiry>) {
    return this.locked(async () => {
      const body = await this.read();
      const index = body.enquiries.findIndex((item) => item.id === id);
      if (index < 0) return null;
      body.enquiries[index] = { ...body.enquiries[index]!, ...patch, id };
      await this.write(body);
      return body.enquiries[index]!;
    });
  }

  async insertFollowUp(record: FollowUp) {
    await this.locked(async () => {
      const body = await this.read();
      body.followups.push(record);
      await this.write(body);
    });
  }

  async listFollowUps() {
    return (await this.read()).followups;
  }

  async recordEvent(event: AnalyticsEvent) {
    await this.locked(async () => {
      const body = await this.read();
      body.events.push(event);
      if (body.events.length > 8000) body.events.splice(0, body.events.length - 8000);
      await this.write(body);
    });
  }

  async listEventsSince(iso: string) {
    const body = await this.read();
    return body.events.filter((event) => event.createdAt >= iso);
  }

  async saveFile(file: StoredFile, bytes: Buffer) {
    await this.locked(async () => {
      const body = await this.read();
      const total = body.files.reduce((sum, item) => sum + item.size, 0);
      if (body.files.length >= 40 || total + bytes.length > 80 * 1024 * 1024) {
        throw new Error("File storage is full.");
      }
      body.files.push({ ...file, data: bytes.toString("base64") });
      await this.write(body);
    });
  }

  async getFile(id: string) {
    const body = await this.read();
    const file = body.files.find((item) => item.id === id);
    if (!file) return null;
    const { data, ...meta } = file;
    return { ...meta, data: Buffer.from(data, "base64") };
  }

  async deleteFile(id: string) {
    await this.locked(async () => {
      const body = await this.read();
      body.files = body.files.filter((item) => item.id !== id);
      await this.write(body);
    });
  }

  async createSession(role: Session["role"]) {
    const token = crypto.randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    await this.locked(async () => {
      const body = await this.read();
      body.sessions = body.sessions.filter((item) => item.expiresAt > new Date().toISOString());
      body.sessions.push({ tokenHash: hashToken(token), role, expiresAt });
      await this.write(body);
    });
    return { token, expiresAt };
  }

  async getSession(token: string) {
    const body = await this.read();
    const session = body.sessions.find((item) => item.tokenHash === hashToken(token));
    if (!session) return null;
    if (session.expiresAt <= new Date().toISOString()) {
      await this.deleteSession(token);
      return null;
    }
    return { role: session.role, expiresAt: session.expiresAt };
  }

  async deleteSession(token: string) {
    const tokenHash = hashToken(token);
    await this.locked(async () => {
      const body = await this.read();
      body.sessions = body.sessions.filter((item) => item.tokenHash !== tokenHash);
      await this.write(body);
    });
  }
}
