import { facultyDayId, facultyId, facultyPayId } from "@/lib/ids";
import { programChoices } from "@/lib/palette";
import { assertSameOrigin, json, readJson } from "@/lib/security";
import { getStore } from "@/lib/store";
import { sessionFromRequest } from "@/lib/auth";
import type { AttendanceStatus, FacultyPayStatus, ProgramSlug } from "@/lib/types";

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
  if (!body.ok || !body.data || typeof body.data !== "object") return json({ ok: false, error: "Check the class payment." }, 400);
  const data = body.data as { teacherId?: unknown; amount?: unknown; classDate?: unknown; paidOn?: unknown; status?: unknown; note?: unknown };
  const teacherId = String(data.teacherId || "");
  const amount = money(data.amount);
  const classDate = day(data.classDate);
  const paidOn = day(data.paidOn);
  const status: FacultyPayStatus | "" = data.status === "paid" || data.status === "due" ? data.status : "";
  const note = String(data.note || "").trim().slice(0, 240);
  const teachers = await getStore().listFaculty();
  if (!teachers.some((teacher) => teacher.id === teacherId) || amount === null || amount <= 0 || !classDate || !status) {
    return json({ ok: false, error: "Choose the teacher, class day, and amount to pay." }, 400);
  }
  const pay = await getStore().saveFacultyPay({
    id: facultyPayId(),
    teacherId,
    amount,
    classDate,
    paidOn: status === "paid" ? paidOn || classDate : "",
    status,
    note: note || "Class pay",
    createdAt: new Date().toISOString(),
  });
  return json({ ok: true, pay }, 201);
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
