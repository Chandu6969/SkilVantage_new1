import { assignmentId, attendanceId, feeId, teacherNoteId } from "@/lib/ids";
import { assertSameOrigin, json, readJson } from "@/lib/security";
import { getStore } from "@/lib/store";
import { sessionFromRequest } from "@/lib/auth";
import type { AssignmentProgress, AttendanceStatus, FeeKind } from "@/lib/types";

async function guard(req: Request) {
  if (!assertSameOrigin(req)) return { error: json({ ok: false, error: "This action can only be taken from the SkilVantage site." }, 403) };
  const session = await sessionFromRequest(req);
  if (!session) return { error: json({ ok: false, error: "Sign in required." }, 401) };
  return { session };
}

function day(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

export async function postAttendance(req: Request) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const body = await readJson(req);
  if (!body.ok || !body.data || typeof body.data !== "object") return json({ ok: false, error: "Check the attendance mark." }, 400);
  const data = body.data as { batchId?: unknown; memberId?: unknown; date?: unknown; status?: unknown };
  const batchId = String(data.batchId || "");
  const memberId = String(data.memberId || "");
  const date = day(data.date);
  const status = data.status === "present" || data.status === "absent" ? data.status : "";
  const batch = await getStore().getBatch(batchId);
  const members = batch ? await getStore().listMembers(batchId) : [];
  if (!batch || !members.some((member) => member.id === memberId) || !date || !status) {
    return json({ ok: false, error: "Choose a student and a valid day." }, 400);
  }
  const mark = await getStore().markAttendance({
    id: attendanceId(),
    batchId,
    memberId,
    date,
    status: status as AttendanceStatus,
    createdAt: new Date().toISOString(),
  });
  return json({ ok: true, mark });
}

export async function postFee(req: Request) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const body = await readJson(req);
  if (!body.ok || !body.data || typeof body.data !== "object") return json({ ok: false, error: "Check the payment." }, 400);
  const data = body.data as { batchId?: unknown; memberId?: unknown; amount?: unknown; kind?: unknown; paidOn?: unknown; note?: unknown };
  const batchId = String(data.batchId || "");
  const memberId = String(data.memberId || "");
  const amount = Number(data.amount);
  const kind = data.kind === "cash" || data.kind === "bank" || data.kind === "upi" ? data.kind : "";
  const paidOn = day(data.paidOn);
  const note = String(data.note || "").slice(0, 240);
  const members = await getStore().listMembers(batchId);
  if (!members.some((member) => member.id === memberId) || !Number.isFinite(amount) || amount <= 0 || amount > 10000000 || !kind || !paidOn) {
    return json({ ok: false, error: "Choose the student, amount, and how it was paid." }, 400);
  }
  const fee = {
    id: feeId(),
    batchId,
    memberId,
    amount: Math.round(amount),
    kind: kind as FeeKind,
    paidOn,
    note,
    createdAt: new Date().toISOString(),
  };
  await getStore().addFee(fee);
  return json({ ok: true, fee }, 201);
}

export async function postAssignment(req: Request) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const body = await readJson(req);
  if (!body.ok || !body.data || typeof body.data !== "object") return json({ ok: false, error: "Check the assignment." }, 400);
  const data = body.data as { batchId?: unknown; title?: unknown; dueOn?: unknown };
  const batchId = String(data.batchId || "");
  const title = String(data.title || "").trim().slice(0, 120);
  const dueOn = day(data.dueOn);
  const members = await getStore().listMembers(batchId);
  if (!title || !dueOn || members.length === 0) return json({ ok: false, error: "Add students to the batch, then name the assignment." }, 400);
  const createdAt = new Date().toISOString();
  for (const member of members) {
    await getStore().addAssignment({
      id: assignmentId(),
      batchId,
      memberId: member.id,
      title,
      dueOn,
      status: "pending",
      createdAt,
    });
  }
  return json({ ok: true }, 201);
}

export async function patchAssignment(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const { id } = await ctx.params;
  const body = await readJson(req);
  if (!body.ok || !body.data || typeof body.data !== "object") return json({ ok: false, error: "Check the update." }, 400);
  const status = (body.data as { status?: unknown }).status;
  if (status !== "pending" && status !== "submitted" && status !== "reviewed") {
    return json({ ok: false, error: "Choose pending, submitted, or reviewed." }, 400);
  }
  const item = await getStore().updateAssignment(id, status as AssignmentProgress);
  if (!item) return json({ ok: false, error: "Assignment not found." }, 404);
  return json({ ok: true, item });
}

export async function postTeacherNote(req: Request) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const body = await readJson(req);
  if (!body.ok || !body.data || typeof body.data !== "object") return json({ ok: false, error: "Check the note." }, 400);
  const data = body.data as { batchId?: unknown; body?: unknown };
  const batchId = String(data.batchId || "");
  const text = String(data.body || "").trim().slice(0, 1000);
  const batch = await getStore().getBatch(batchId);
  if (!batch || !text) return json({ ok: false, error: "Choose a batch and write the note." }, 400);
  const note = { id: teacherNoteId(), batchId, body: text, createdAt: new Date().toISOString() };
  await getStore().addTeacherNote(note);
  return json({ ok: true, note }, 201);
}
