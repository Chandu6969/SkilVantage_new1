import { memberId } from "@/lib/ids";
import { assertSameOrigin, json, readJson } from "@/lib/security";
import { getStore } from "@/lib/store";
import { sessionFromRequest } from "@/lib/auth";
import { batchCreateSchema, memberCreateSchema, memberPatchSchema, zodFieldErrors } from "@/lib/validation";
import type { BatchMember } from "@/lib/types";

async function guard(req: Request) {
  if (!assertSameOrigin(req)) return { error: json({ ok: false, error: "This action can only be taken from the SkilVantage site." }, 403) };
  const session = await sessionFromRequest(req);
  if (!session) return { error: json({ ok: false, error: "Sign in required." }, 401) };
  return { session };
}

export async function getBatches(req: Request) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const learnerType = new URL(req.url).searchParams.get("learnerType");
  const type = learnerType === "student" || learnerType === "professional" ? learnerType : undefined;
  const batches = await getStore().listBatches(type);
  const members = await Promise.all(batches.map((batch) => getStore().listMembers(batch.id)));
  return json({
    ok: true,
    batches: batches.map((batch, index) => ({ ...batch, count: members[index]!.length })),
  });
}

export async function postBatch(req: Request) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const body = await readJson(req);
  if (!body.ok) return json({ ok: false, error: body.error }, 400);
  const parsed = batchCreateSchema.safeParse(body.data);
  if (!parsed.success) return json({ ok: false, error: "Check the batch name.", fields: zodFieldErrors(parsed.error) }, 400);
  const batch = await getStore().createBatch(parsed.data);
  return json({ ok: true, batch }, 201);
}

export async function getBatch(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const { id } = await ctx.params;
  const batch = await getStore().getBatch(id);
  if (!batch) return json({ ok: false, error: "Batch not found." }, 404);
  const members = await getStore().listMembers(id);
  return json({ ok: true, batch, members });
}

export async function postMember(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const { id } = await ctx.params;
  const batch = await getStore().getBatch(id);
  if (!batch) return json({ ok: false, error: "Batch not found." }, 404);
  const body = await readJson(req);
  if (!body.ok) return json({ ok: false, error: body.error }, 400);
  const parsed = memberCreateSchema.safeParse(body.data);
  if (!parsed.success) return json({ ok: false, error: "Check the student details.", fields: zodFieldErrors(parsed.error) }, 400);
  const member: BatchMember = {
    id: memberId(),
    batchId: id,
    fullName: parsed.data.fullName,
    phone: parsed.data.phone,
    email: parsed.data.email.toLowerCase(),
    note: parsed.data.note,
    messaged: false,
    absentToday: false,
    createdAt: new Date().toISOString(),
  };
  await getStore().addMember(member);
  return json({ ok: true, member }, 201);
}

export async function patchMember(req: Request, ctx: { params: Promise<{ id: string; memberId: string }> }) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const { memberId: id } = await ctx.params;
  const body = await readJson(req);
  if (!body.ok) return json({ ok: false, error: body.error }, 400);
  const parsed = memberPatchSchema.safeParse(body.data);
  if (!parsed.success) return json({ ok: false, error: "Check the update." }, 400);
  const member = await getStore().updateMember(id, parsed.data);
  if (!member) return json({ ok: false, error: "Person not found." }, 404);
  return json({ ok: true, member });
}

export async function postReset(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const { id } = await ctx.params;
  const batch = await getStore().getBatch(id);
  if (!batch) return json({ ok: false, error: "Batch not found." }, 404);
  await getStore().resetMessaged(id);
  return json({ ok: true });
}
