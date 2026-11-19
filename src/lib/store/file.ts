import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { STARTER_BATCHES, ordinalLabel } from "@/lib/batches";
import { classPay } from "@/lib/faculty";
import { assignmentId, batchId, facultyPayId } from "@/lib/ids";
import { hashToken } from "@/lib/security";
import { buildSeed } from "@/lib/store/seed";
import type { LeadStore } from "@/lib/store/types";
import { emptyCashBook } from "@/lib/cash-book";
import type { AnalyticsEvent, AttendanceMark, BatchMember, CashBook, CashEntry, ClassAssignment, Enquiry, Faculty, FacultyDay, FacultyPay, FeePayment, FollowUp, LearnerType, Registration, RemovedLearner, Session, StoredFile, TeacherNote, TrainingBatch } from "@/lib/types";

interface FileBody {
  meta: Record<string, string>;
  registrations: Registration[];
  enquiries: Enquiry[];
  followups: FollowUp[];
  events: AnalyticsEvent[];
  files: (StoredFile & { data: string })[];
  sessions: { tokenHash: string; role: Session["role"]; expiresAt: string }[];
  batches: TrainingBatch[];
  learners: BatchMember[];
  removed: RemovedLearner[];
  attendance: AttendanceMark[];
  fees: FeePayment[];
  assignments: ClassAssignment[];
  teacherNotes: TeacherNote[];
  teachers: Faculty[];
  teacherDays: FacultyDay[];
  teacherPays: FacultyPay[];
  cashBook: CashBook;
  cashEntries: CashEntry[];
}

function emptyBody(): FileBody {
    return { meta: {}, registrations: [], enquiries: [], followups: [], events: [], files: [], sessions: [], batches: [], learners: [], removed: [], attendance: [], fees: [], assignments: [], teacherNotes: [], teachers: [], teacherDays: [], teacherPays: [], cashBook: emptyCashBook(), cashEntries: [] };
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
      parsed.batches ||= [];
      parsed.learners ||= [];
      parsed.removed ||= [];
      parsed.attendance ||= [];
      parsed.fees ||= [];
      parsed.assignments ||= [];
      parsed.teacherNotes ||= [];
      parsed.teachers ||= [];
      parsed.teacherDays ||= [];
      parsed.teacherPays ||= [];
      parsed.cashBook ||= emptyCashBook();
      parsed.cashEntries ||= [];
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

  private ensureBatches(body: FileBody) {
    let changed = false;
    const retired = new Set((body.meta.retiredBatches || "").split(",").filter(Boolean));
    for (const starter of STARTER_BATCHES) {
      if (retired.has(starter.id)) continue;
      if (!body.batches.some((item) => item.id === starter.id)) {
        body.batches.push({ ...starter });
        changed = true;
      }
    }
    return changed;
  }

  async listBatches(learnerType?: LearnerType) {
    return this.locked(async () => {
      const body = await this.read();
      const changed = this.ensureBatches(body);
      if (changed) await this.write(body);
      return body.batches
        .filter((item) => !learnerType || item.learnerType === learnerType)
        .sort((a, b) => a.sort - b.sort);
    });
  }

  async getBatch(id: string) {
    const batches = await this.listBatches();
    return batches.find((item) => item.id === id) || null;
  }

  async createBatch(input: { name: string; learnerType: LearnerType }) {
    return this.locked(async () => {
      const body = await this.read();
      this.ensureBatches(body);
      const name = input.name.trim();
      const duplicate = body.batches.find(
        (item) => item.learnerType === input.learnerType && item.name.toLowerCase() === name.toLowerCase(),
      );
      if (duplicate) return duplicate;
      const sort = body.batches.filter((item) => item.learnerType === input.learnerType).reduce((max, item) => Math.max(max, item.sort), 0) + 1;
      const batch: TrainingBatch = {
        id: batchId(),
        name,
        label: ordinalLabel(sort),
        learnerType: input.learnerType,
        sort,
        createdAt: new Date().toISOString(),
      };
      body.batches.push(batch);
      await this.write(body);
      return batch;
    });
  }

  async updateBatch(id: string, patch: { name: string }) {
    return this.locked(async () => {
      const body = await this.read();
      const batch = body.batches.find((item) => item.id === id);
      if (!batch) return null;
      batch.name = patch.name.trim();
      await this.write(body);
      return batch;
    });
  }

  async deleteBatch(id: string) {
    return this.locked(async () => {
      const body = await this.read();
      const batch = body.batches.find((item) => item.id === id);
      if (!batch) return false;
      const memberIds = new Set(body.learners.filter((item) => item.batchId === id).map((item) => item.id));
      body.batches = body.batches.filter((item) => item.id !== id);
      body.learners = body.learners.filter((item) => item.batchId !== id);
      body.attendance = body.attendance.filter((item) => item.batchId !== id && !memberIds.has(item.memberId));
      body.fees = body.fees.filter((item) => item.batchId !== id && !memberIds.has(item.memberId));
      body.assignments = body.assignments.filter((item) => item.batchId !== id && !memberIds.has(item.memberId));
      body.teacherNotes = body.teacherNotes.filter((item) => item.batchId !== id);
      const retired = new Set((body.meta.retiredBatches || "").split(",").filter(Boolean));
      retired.add(id);
      body.meta.retiredBatches = [...retired].join(",");
      await this.write(body);
      return true;
    });
  }

  async listMembers(batchId: string) {
    const body = await this.read();
    return body.learners.filter((item) => item.batchId === batchId).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  async addMember(member: BatchMember) {
    await this.locked(async () => {
      const body = await this.read();
      body.learners.push(member);
      this.fillAssignments(body, member.batchId);
      await this.write(body);
    });
  }

  async removeMember(id: string) {
    return this.locked(async () => {
      const body = await this.read();
      const member = body.learners.find((item) => item.id === id);
      if (!member) return null;
      body.learners = body.learners.filter((item) => item.id !== id);
      await this.write(body);
      return member;
    });
  }

  async listRemoved(learnerType?: LearnerType) {
    const body = await this.read();
    return body.removed
      .filter((item) => !learnerType || item.learnerType === learnerType)
      .sort((a, b) => b.removedAt.localeCompare(a.removedAt));
  }

  async addRemoved(item: RemovedLearner) {
    await this.locked(async () => {
      const body = await this.read();
      body.removed.push(item);
      await this.write(body);
    });
  }

  async updateMember(id: string, patch: Partial<Pick<BatchMember, "fullName" | "phone" | "email" | "note" | "batchId" | "messaged" | "absentToday">>) {
    return this.locked(async () => {
      const body = await this.read();
      const member = body.learners.find((item) => item.id === id);
      if (!member) return null;
      if (patch.batchId && patch.batchId !== member.batchId) {
        const next = body.batches.find((item) => item.id === patch.batchId);
        const current = body.batches.find((item) => item.id === member.batchId);
        if (!next || !current || next.learnerType !== current.learnerType) return null;
        member.batchId = next.id;
        for (const row of body.attendance) if (row.memberId === id) row.batchId = next.id;
        for (const row of body.fees) if (row.memberId === id) row.batchId = next.id;
        for (const row of body.assignments) if (row.memberId === id) row.batchId = next.id;
        this.fillAssignments(body, next.id);
      }
      if (patch.fullName !== undefined) member.fullName = patch.fullName;
      if (patch.phone !== undefined) member.phone = patch.phone;
      if (patch.email !== undefined) member.email = patch.email;
      if (patch.note !== undefined) member.note = patch.note;
      if (patch.messaged !== undefined) member.messaged = patch.messaged;
      if (patch.absentToday !== undefined) member.absentToday = patch.absentToday;
      await this.write(body);
      return member;
    });
  }

  async listAttendance(batchId: string) {
    const body = await this.read();
    return body.attendance.filter((item) => item.batchId === batchId).sort((a, b) => b.date.localeCompare(a.date));
  }

  async markAttendance(mark: AttendanceMark) {
    return this.locked(async () => {
      const body = await this.read();
      body.attendance = body.attendance.filter(
        (item) => !(item.batchId === mark.batchId && item.memberId === mark.memberId && item.date === mark.date),
      );
      body.attendance.push(mark);
      await this.write(body);
      return mark;
    });
  }

  async clearAttendance(batchId: string, memberId: string, date: string) {
    await this.locked(async () => {
      const body = await this.read();
      body.attendance = body.attendance.filter((item) => !(item.batchId === batchId && item.memberId === memberId && item.date === date));
      await this.write(body);
    });
  }

  async listFees() {
    const body = await this.read();
    return body.fees.sort((a, b) => b.paidOn.localeCompare(a.paidOn) || b.createdAt.localeCompare(a.createdAt));
  }

  async addFee(fee: FeePayment) {
    await this.locked(async () => {
      const body = await this.read();
      body.fees.push(fee);
      await this.write(body);
    });
  }

  async updateFee(fee: FeePayment) {
    await this.locked(async () => {
      const body = await this.read();
      const index = body.fees.findIndex((item) => item.id === fee.id);
      if (index === -1) body.fees.push(fee);
      else body.fees[index] = fee;
      await this.write(body);
    });
  }

  async deleteFee(id: string) {
    return this.locked(async () => {
      const body = await this.read();
      const before = body.fees.length;
      body.fees = body.fees.filter((item) => item.id !== id);
      if (body.fees.length === before) return false;
      await this.write(body);
      return true;
    });
  }

  async listAssignments(batchId?: string) {
    const body = await this.read();
    return body.assignments
      .filter((item) => !batchId || item.batchId === batchId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async addAssignment(item: ClassAssignment) {
    await this.locked(async () => {
      const body = await this.read();
      body.assignments.push(item);
      await this.write(body);
    });
  }

  async updateAssignment(id: string, status: ClassAssignment["status"]) {
    return this.locked(async () => {
      const body = await this.read();
      const item = body.assignments.find((row) => row.id === id);
      if (!item) return null;
      item.status = status;
      await this.write(body);
      return item;
    });
  }

  async syncAssignments(batchId: string) {
    await this.locked(async () => {
      const body = await this.read();
      if (this.fillAssignments(body, batchId) > 0) await this.write(body);
    });
  }

  private fillAssignments(body: FileBody, batchId: string) {
    const members = body.learners.filter((item) => item.batchId === batchId);
    const templates = new Map<string, { title: string; dueOn: string }>();
    for (const item of body.assignments) {
      if (item.batchId !== batchId) continue;
      templates.set(`${item.title}\n${item.dueOn}`, { title: item.title, dueOn: item.dueOn });
    }
    const createdAt = new Date().toISOString();
    let added = 0;
    for (const member of members) {
      for (const template of templates.values()) {
        const has = body.assignments.some((item) => item.memberId === member.id && item.title === template.title && item.dueOn === template.dueOn);
        if (has) continue;
        body.assignments.push({
          id: assignmentId(),
          batchId,
          memberId: member.id,
          title: template.title,
          dueOn: template.dueOn,
          status: "pending",
          createdAt,
        });
        added += 1;
      }
    }
    return added;
  }

  async listTeacherNotes(batchId?: string) {
    const body = await this.read();
    return body.teacherNotes
      .filter((item) => !batchId || item.batchId === batchId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async addTeacherNote(note: TeacherNote) {
    await this.locked(async () => {
      const body = await this.read();
      body.teacherNotes.push(note);
      await this.write(body);
    });
  }

  async listFaculty() {
    const body = await this.read();
    return body.teachers.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  async updateFaculty(id: string, patch: Partial<Pick<Faculty, "fullName" | "phone" | "email" | "course" | "rate" | "note">>) {
    return this.locked(async () => {
      const body = await this.read();
      const teacher = body.teachers.find((item) => item.id === id);
      if (!teacher) return null;
      Object.assign(teacher, patch);
      await this.write(body);
      return teacher;
    });
  }

  async addFaculty(person: Faculty) {
    await this.locked(async () => {
      const body = await this.read();
      body.teachers.push(person);
      await this.write(body);
    });
  }

  async deleteFaculty(id: string) {
    return this.locked(async () => {
      const body = await this.read();
      const teacher = body.teachers.find((item) => item.id === id);
      if (!teacher) return false;
      body.teachers = body.teachers.filter((item) => item.id !== id);
      body.teacherDays = body.teacherDays.filter((item) => item.teacherId !== id);
      body.teacherPays = body.teacherPays.filter((item) => item.teacherId !== id);
      await this.write(body);
      return true;
    });
  }

  async listFacultyDays() {
    const body = await this.read();
    return body.teacherDays.sort((a, b) => b.date.localeCompare(a.date));
  }

  async markFacultyDay(day: FacultyDay) {
    return this.locked(async () => {
      const body = await this.read();
      body.teacherDays = body.teacherDays.filter((item) => !(item.teacherId === day.teacherId && item.date === day.date));
      body.teacherDays.push(day);
      const teacher = body.teachers.find((item) => item.id === day.teacherId);
      const existing = body.teacherPays.find((item) => item.teacherId === day.teacherId && item.classDate === day.date);
      if (day.status === "absent") {
        if (existing?.status === "due") body.teacherPays = body.teacherPays.filter((item) => item.id !== existing.id);
      } else if (teacher && !existing) {
        body.teacherPays.push({
          id: facultyPayId(),
          teacherId: day.teacherId,
          amount: classPay(teacher.rate),
          classDate: day.date,
          paidOn: "",
          status: "due",
          note: "Class pay",
          createdAt: day.createdAt,
        });
      }
      await this.write(body);
      return day;
    });
  }

  async listFacultyPays() {
    const body = await this.read();
    return body.teacherPays.sort((a, b) => b.classDate.localeCompare(a.classDate) || b.createdAt.localeCompare(a.createdAt));
  }

  async saveFacultyPay(pay: FacultyPay) {
    return this.locked(async () => {
      const body = await this.read();
      const existing = body.teacherPays.find((item) => item.teacherId === pay.teacherId && item.classDate === pay.classDate && (item.session || "") === (pay.session || ""));
      if (existing) {
        existing.amount = pay.amount;
        existing.status = pay.status;
        existing.note = pay.note || existing.note;
        existing.paidOn = pay.paidOn;
        if (pay.subject) existing.subject = pay.subject;
        if (pay.session) existing.session = pay.session;
        if (pay.kind) existing.kind = pay.kind;
        await this.write(body);
        return existing;
      }
      body.teacherPays.push(pay);
      await this.write(body);
      return pay;
    });
  }

  async deleteFacultyPay(id: string) {
    return this.locked(async () => {
      const body = await this.read();
      const before = body.teacherPays.length;
      body.teacherPays = body.teacherPays.filter((item) => item.id !== id);
      if (body.teacherPays.length === before) return false;
      await this.write(body);
      return true;
    });
  }

  async getCashBook() {
    const body = await this.read();
    return body.cashBook || emptyCashBook();
  }

  async saveCashBook(book: Pick<CashBook, "openingCash" | "openingBank">) {
    return this.locked(async () => {
      const body = await this.read();
      body.cashBook = {
        openingCash: book.openingCash,
        openingBank: book.openingBank,
        updatedAt: new Date().toISOString(),
        syncedAt: body.cashBook?.syncedAt || "",
      };
      await this.write(body);
      return body.cashBook;
    });
  }

  async markCashSynced(at: string) {
    return this.locked(async () => {
      const body = await this.read();
      body.cashBook = { ...(body.cashBook || emptyCashBook()), syncedAt: at };
      await this.write(body);
      return body.cashBook;
    });
  }

  async listCashEntries() {
    const body = await this.read();
    return [...(body.cashEntries || [])].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }

  async addCashEntry(entry: CashEntry) {
    await this.locked(async () => {
      const body = await this.read();
      body.cashEntries ||= [];
      body.cashEntries.push(entry);
      await this.write(body);
    });
  }

  async updateCashEntry(id: string, patch: Omit<CashEntry, "id" | "createdAt">) {
    return this.locked(async () => {
      const body = await this.read();
      const entry = body.cashEntries.find((item) => item.id === id);
      if (!entry) return null;
      Object.assign(entry, patch);
      await this.write(body);
      return entry;
    });
  }

  async deleteCashEntry(id: string) {
    return this.locked(async () => {
      const body = await this.read();
      const before = body.cashEntries.length;
      body.cashEntries = body.cashEntries.filter((item) => item.id !== id);
      if (body.cashEntries.length === before) return false;
      await this.write(body);
      return true;
    });
  }

  async settleFacultyPay(id: string, paidOn: string) {
    return this.locked(async () => {
      const body = await this.read();
      const item = body.teacherPays.find((row) => row.id === id);
      if (!item) return null;
      item.status = "paid";
      item.paidOn = paidOn;
      await this.write(body);
      return item;
    });
  }

  async resetMessaged(batchId: string) {
    await this.locked(async () => {
      const body = await this.read();
      for (const member of body.learners) {
        if (member.batchId === batchId) member.messaged = false;
      }
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
