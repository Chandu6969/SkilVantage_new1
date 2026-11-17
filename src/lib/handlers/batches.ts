import { memberId, registrationId, removedId } from "@/lib/ids";
import { assertSameOrigin, json, readJson } from "@/lib/security";
import { getStore } from "@/lib/store";
import { sessionFromRequest } from "@/lib/auth";
import { batchCreateSchema, memberCreateSchema, memberPatchSchema, zodFieldErrors } from "@/lib/validation";
import type { BatchMember, Registration } from "@/lib/types";

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

function emptyLead(member: BatchMember, learnerType: Registration["learnerType"], batchName: string): Registration {
  const now = new Date().toISOString();
  return {
    id: registrationId(learnerType),
    createdAt: now,
    learnerType,
    program: "data-analyst",
    status: "Follow-up Required",
    fullName: member.fullName,
    phone: member.phone,
    email: member.email,
    city: "Hyderabad",
    state: "Telangana",
    gender: "",
    college: "",
    degree: "",
    branch: "",
    passedOutYear: "",
    currentYear: "",
    skills: "",
    programmingLanguages: "",
    tools: "",
    projects: "",
    certifications: "",
    preferredTrack: "",
    expectedPackage: "",
    preferredRole: "",
    opportunity: "",
    learningMode: "",
    availability: "",
    source: "Returned from batch",
    linkedin: "",
    github: "",
    company: "",
    currentRole: "",
    experience: "",
    industry: "",
    currentSkills: "",
    previousExperience: "",
    targetTrack: "",
    targetRole: "",
    careerChangeReason: "",
    currentPackage: "",
    noticePeriod: "",
    batchTiming: "",
    counsellorNotes: `Returned from the ${batchName} batch.`,
    followUpDate: null,
    resumeFileId: null,
    resumeName: null,
    sheetsSynced: false,
    sample: false,
    consentAt: now,
  };
}

export async function deleteMember(req: Request, ctx: { params: Promise<{ id: string; memberId: string }> }) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const { id: batchId, memberId: id } = await ctx.params;
  const batch = await getStore().getBatch(batchId);
  if (!batch) return json({ ok: false, error: "Batch not found." }, 404);
  const member = await getStore().removeMember(id);
  if (!member || member.batchId !== batchId) return json({ ok: false, error: "Person not found." }, 404);
  const digits = member.phone.replace(/\D/g, "");
  const leads = await getStore().listRegistrations();
  const existing = digits
    ? leads.find((item) => !item.sample && item.learnerType === batch.learnerType && item.phone.replace(/\D/g, "") === digits)
    : undefined;
  const note = `Returned from the ${batch.name} batch.`;
  let leadId = existing?.id || "";
  if (existing) {
    const updated = await getStore().updateRegistration(existing.id, {
      status: "Follow-up Required",
      counsellorNotes: existing.counsellorNotes ? `${existing.counsellorNotes} ${note}` : note,
    });
    leadId = updated?.id || existing.id;
  } else {
    const lead = emptyLead(member, batch.learnerType, batch.name);
    await getStore().insertRegistration(lead);
    leadId = lead.id;
  }
  await getStore().addRemoved({
    id: removedId(),
    memberId: member.id,
    batchId: batch.id,
    batchName: batch.name,
    learnerType: batch.learnerType,
    fullName: member.fullName,
    phone: member.phone,
    email: member.email,
    registrationId: leadId,
    removedAt: new Date().toISOString(),
  });
  return json({ ok: true, registrationId: leadId });
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
