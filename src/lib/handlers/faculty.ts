import { CLASS_SESSIONS, DEFAULT_CLASS_PAY, classPay } from "@/lib/faculty";
import { facultyDayId, facultyId, facultyPayId } from "@/lib/ids";
import { programChoices, programName } from "@/lib/palette";
import { assertSameOrigin, json, readJson } from "@/lib/security";
import { getStore } from "@/lib/store";
import { sessionFromRequest } from "@/lib/auth";
import type { AttendanceStatus, ClassRecordKind, ProgramSlug } from "@/lib/types";

const courses = new Set(programChoices.map((item) => item.slug));

async function guard(req: Request) {
  if (!assertSameOrigin(req)) return { error: json({ ok: false, error: "This action can only be taken from the SkilVantage site." }, 403) };
  const session = await sessionFromRequest(req);
  if (!session) return { error: json({ ok: false, error: "Sign in required." }, 401) };
  return { session };
}

function day(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function money(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > 10000000) return null;
  return Math.round(amount);
}

export async function postFaculty(req: Request) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const body = await readJson(req);
  if (!body.ok || !body.data || typeof body.data !== "object") return json({ ok: false, error: "Check the teacher details." }, 400);
  const data = body.data as { fullName?: unknown; phone?: unknown; email?: unknown; course?: unknown; rate?: unknown; note?: unknown };
  const fullName = String(data.fullName || "").trim().slice(0, 80);
  const phone = String(data.phone || "").trim().slice(0, 20);
  const email = String(data.email || "").trim().toLowerCase().slice(0, 120);
  const course = String(data.course || "");
  const rate = money(data.rate);
  const note = String(data.note || "").trim().slice(0, 240);
  if (!fullName || !phone || !courses.has(course as ProgramSlug) || rate === null) {
    return json({ ok: false, error: "Add the name, phone, course, and class pay." }, 400);
  }
  const person = {
    id: facultyId(),
    fullName,
    phone,
    email,
    course: course as ProgramSlug,
    rate,
    note,
    createdAt: new Date().toISOString(),
  };
  await getStore().addFaculty(person);
  return json({ ok: true, teacher: person }, 201);
}

export async function patchFaculty(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const { id } = await ctx.params;
  const body = await readJson(req);
  if (!body.ok || !body.data || typeof body.data !== "object") return json({ ok: false, error: "Check the teacher details." }, 400);
  const data = body.data as { fullName?: unknown; phone?: unknown; email?: unknown; course?: unknown; rate?: unknown; note?: unknown };
  const fullName = String(data.fullName || "").trim().slice(0, 80);
  const phone = String(data.phone || "").trim().slice(0, 20);
  const email = String(data.email || "").trim().toLowerCase().slice(0, 120);
  const course = String(data.course || "");
  const rate = money(data.rate);
  const note = String(data.note || "").trim().slice(0, 240);
  if (!fullName || !phone || !courses.has(course as ProgramSlug) || rate === null) {
    return json({ ok: false, error: "Add the name, phone, course, and class pay." }, 400);
  }
  const teacher = await getStore().updateFaculty(id, {
    fullName,
    phone,
    email,
    course: course as ProgramSlug,
    rate: rate || DEFAULT_CLASS_PAY,
    note,
  });
  if (!teacher) return json({ ok: false, error: "Teacher not found." }, 404);
  return json({ ok: true, teacher });
}

export async function deleteFaculty(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const { id } = await ctx.params;
  const removed = await getStore().deleteFaculty(id);
  if (!removed) return json({ ok: false, error: "That teacher is not on the list." }, 404);
  return json({ ok: true });
}

export async function postFacultyDay(req: Request) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const body = await readJson(req);
  if (!body.ok || !body.data || typeof body.data !== "object") return json({ ok: false, error: "Check the attendance." }, 400);
  const data = body.data as { teacherId?: unknown; date?: unknown; status?: unknown };
  const teacherId = String(data.teacherId || "");
  const date = day(data.date);
  const status = data.status === "present" || data.status === "absent" ? data.status : "";
  const teachers = await getStore().listFaculty();
  if (!teachers.some((teacher) => teacher.id === teacherId) || !date || !status) {
    return json({ ok: false, error: "Choose a teacher and a valid day." }, 400);
  }
  const mark = await getStore().markFacultyDay({
    id: facultyDayId(),
    teacherId,
    date,
    status: status as AttendanceStatus,
    createdAt: new Date().toISOString(),
  });
  return json({ ok: true, mark });
}

export async function postFacultyPay(req: Request) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const body = await readJson(req);
  if (!body.ok || !body.data || typeof body.data !== "object") return json({ ok: false, error: "Check the class." }, 400);
  const data = body.data as { teacherId?: unknown; classDate?: unknown; subject?: unknown; session?: unknown; kind?: unknown };
  const teacherId = String(data.teacherId || "");
  const classDate = day(data.classDate);
  const session = String(data.session || "");
  const kind: ClassRecordKind = data.kind === "deducted" ? "deducted" : "taken";
  const teachers = await getStore().listFaculty();
  const teacher = teachers.find((item) => item.id === teacherId);
  const subject = String(data.subject || "").trim().slice(0, 80) || (teacher ? programName(teacher.course) : "");
  if (!teacher || !classDate || !CLASS_SESSIONS.includes(session as (typeof CLASS_SESSIONS)[number]) || !subject) {
    return json({ ok: false, error: "Choose the teacher, date, course, and class session." }, 400);
  }
  const pay = await getStore().saveFacultyPay({
    id: facultyPayId(),
    teacherId,
    amount: classPay(teacher.rate),
    classDate,
    paidOn: "",
    status: "due",
    note: subject,
    subject,
    session,
    kind,
    createdAt: new Date().toISOString(),
  });
  return json({ ok: true, pay }, 201);
}

export async function deleteFacultyPay(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const { id } = await ctx.params;
  const removed = await getStore().deleteFacultyPay(id);
  if (!removed) return json({ ok: false, error: "That class is not on the record." }, 404);
  return json({ ok: true });
}

export async function patchFacultyPay(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const { id } = await ctx.params;
  const body = await readJson(req);
  const paidOn = body.ok && body.data && typeof body.data === "object" ? day((body.data as { paidOn?: unknown }).paidOn) : "";
  const item = await getStore().settleFacultyPay(id, paidOn || new Date().toISOString().slice(0, 10));
  if (!item) return json({ ok: false, error: "Class payment not found." }, 404);
  return json({ ok: true, pay: item });
}
