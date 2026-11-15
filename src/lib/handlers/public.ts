import crypto from "crypto";
import { getProgram, programs } from "@/lib/content";
import { issueChallenge, verifyChallenge } from "@/lib/challenge";
import { enquiryFromInput, newFileMeta, registrationFromInput } from "@/lib/records";
import { assertSameOrigin, clientIp, json, rateLimit, readJson, sniffResume } from "@/lib/security";
import { getStore } from "@/lib/store";
import { mirrorEnquiry, mirrorRegistration, sheetsConfigured } from "@/lib/sheets";
import { isRegistrationId } from "@/lib/ids";
import { analyticsSchema, enquirySchema, parseRegistration, zodFieldErrors } from "@/lib/validation";
import { safeFilename } from "@/lib/text";

async function readSubmission(req: Request) {
  const type = req.headers.get("content-type") || "";
  if (type.includes("multipart/form-data")) {
    const form = await req.formData();
    const payload = form.get("payload");
    if (typeof payload !== "string" || payload.length > 100_000) {
      return { ok: false as const, error: "The form could not be read." };
    }
    let fields: unknown;
    try {
      fields = JSON.parse(payload);
    } catch {
      return { ok: false as const, error: "The form could not be read." };
    }
    const file = form.get("resume");
    let resume: { filename: string; mime: string; bytes: Buffer } | null = null;
    if (file instanceof File && file.size > 0) {
      resume = { filename: file.name, mime: file.type, bytes: Buffer.from(await file.arrayBuffer()) };
    }
    return {
      ok: true as const,
      fields,
      token: String(form.get("challengeToken") || ""),
      answer: String(form.get("challengeAnswer") || ""),
      honeypot: String(form.get("company_website") || ""),
      resume,
    };
  }
  const body = await readJson(req, 7_000_000);
  if (!body.ok) return body;
  if (!body.data || typeof body.data !== "object") return { ok: false as const, error: "The form could not be read." };
  const record = body.data as Record<string, unknown>;
  const { challengeToken, challengeAnswer, company_website, resumeBase64, resumeName, resumeMime, ...fields } = record;
  let resume: { filename: string; mime: string; bytes: Buffer } | null = null;
  if (typeof resumeBase64 === "string" && resumeBase64.length > 0) {
    resume = {
      filename: typeof resumeName === "string" ? resumeName : "resume.pdf",
      mime: typeof resumeMime === "string" ? resumeMime : "application/pdf",
      bytes: Buffer.from(resumeBase64, "base64"),
    };
  }
  return {
    ok: true as const,
    fields,
    token: typeof challengeToken === "string" ? challengeToken : "",
    answer: typeof challengeAnswer === "string" ? challengeAnswer : "",
    honeypot: typeof company_website === "string" ? company_website : "",
    resume,
  };
}

async function storeResume(resume: { filename: string; mime: string; bytes: Buffer } | null) {
  if (!resume) return { ok: true as const, saved: null };
  const check = sniffResume(resume.filename, resume.mime, resume.bytes);
  if (!check.ok) return check;
  const meta = newFileMeta(safeFilename(resume.filename), resume.mime || "application/octet-stream", resume.bytes.length);
  try {
    await getStore().saveFile(meta, resume.bytes);
  } catch {
    return { ok: false as const, error: "The resume could not be stored. You can submit again without the file." };
  }
  return { ok: true as const, saved: { id: meta.id, name: meta.filename } };
}

export async function getHealth() {
  return json({
    ok: true,
    service: "skilvantage",
    api: "v1",
    storage: getStore().kind,
    sheets: sheetsConfigured(),
  });
}

export async function getCourses() {
  return json({
    ok: true,
    version: "v1",
    courses: programs.map((program) => ({
      slug: program.slug,
      name: program.name,
      description: program.description,
      duration: program.duration,
      level: program.level,
      prerequisites: program.prerequisites,
      skills: program.skills,
      tools: program.tools,
      roles: program.roles,
      curriculum: program.curriculum,
      projects: program.projects,
    })),
  });
}

export async function getCourse(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const program = getProgram(slug);
  if (!program) return json({ ok: false, error: "Course not found." }, 404);
  return json({
    ok: true,
    version: "v1",
    course: {
      slug: program.slug,
      name: program.name,
      description: program.description,
      overview: program.overview,
      duration: program.duration,
      level: program.level,
      prerequisites: program.prerequisites,
      skills: program.skills,
      tools: program.tools,
      roles: program.roles,
      curriculum: program.curriculum,
      phases: program.phases,
      projects: program.projects,
      studentTrack: program.studentTrack,
      professionalTrack: program.professionalTrack,
    },
  });
}

export async function getChallenge() {
  const challenge = await issueChallenge();
  return json({ ok: true, ...challenge });
}

export async function postRegistration(req: Request) {
  if (!assertSameOrigin(req)) return json({ ok: false, error: "This form can only be submitted from the SkilVantage site." }, 403);
  if (!rateLimit(`reg:${clientIp(req)}`, 8, 60 * 60 * 1000)) {
    return json({ ok: false, error: "Too many registrations from this network. Please try again later." }, 429);
  }
  const incoming = await readSubmission(req);
  if (!incoming.ok) return json({ ok: false, error: incoming.error }, 400);
  if (incoming.honeypot) return json({ ok: false, error: "The form could not be submitted." }, 400);
  const challenge = await verifyChallenge(incoming.token, incoming.answer);
  if (!challenge.ok) return json({ ok: false, error: challenge.error }, 400);
  const parsed = parseRegistration(incoming.fields);
  if (!parsed.ok) return json({ ok: false, error: parsed.error, fields: parsed.fields }, 400);

  const existing = await getStore().findRecentDuplicate(parsed.data.email, parsed.data.program);
  if (existing) {
    return json({ ok: true, id: existing.id, duplicate: true, version: "v1" });
  }

  const resume = await storeResume(incoming.resume);
  if (!resume.ok) return json({ ok: false, error: resume.error }, 400);
  const record = registrationFromInput(parsed.data, resume.saved);
  try {
    await getStore().insertRegistration(record);
    await getStore().recordEvent({
      id: crypto.randomUUID(),
      createdAt: record.createdAt,
      eventType: "registration",
      path: "/register",
      course: record.program,
      learnerType: record.learnerType,
      device: "unknown",
      source: record.source || null,
      visitorId: null,
      sample: false,
    });
  } catch {
    return json({ ok: false, error: "We could not save your registration. Please try again shortly." }, 503);
  }
  void mirrorRegistration(record).then(async (ok) => {
    if (ok) await getStore().updateRegistration(record.id, { sheetsSynced: true });
  });
  return json({ ok: true, id: record.id, duplicate: false, version: "v1" }, 201);
}

export async function getConfirmation(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isRegistrationId(id)) return json({ ok: false, error: "Registration not found." }, 404);
  const record = await getStore().getRegistration(id);
  if (!record) return json({ ok: false, error: "Registration not found." }, 404);
  const program = getProgram(record.program);
  return json({
    ok: true,
    registration: {
      id: record.id,
      program: program?.name || record.program,
      slug: record.program,
      learnerType: record.learnerType === "student" ? "Student / Fresher" : "Working Professional",
      createdAt: record.createdAt,
    },
  });
}

export async function postEnquiry(req: Request) {
  if (!assertSameOrigin(req)) return json({ ok: false, error: "This form can only be submitted from the SkilVantage site." }, 403);
  if (!rateLimit(`enq:${clientIp(req)}`, 12, 60 * 60 * 1000)) {
    return json({ ok: false, error: "Too many messages from this network. Please try again later." }, 429);
  }
  const incoming = await readSubmission(req);
  if (!incoming.ok) return json({ ok: false, error: incoming.error }, 400);
  if (incoming.honeypot) return json({ ok: false, error: "The form could not be submitted." }, 400);
  const challenge = await verifyChallenge(incoming.token, incoming.answer);
  if (!challenge.ok) return json({ ok: false, error: challenge.error }, 400);
  const parsed = enquirySchema.safeParse(incoming.fields);
  if (!parsed.success) {
    return json({ ok: false, error: "Check the highlighted fields.", fields: zodFieldErrors(parsed.error) }, 400);
  }
  const enquiry = enquiryFromInput(parsed.data);
  try {
    await getStore().insertEnquiry(enquiry);
    await getStore().recordEvent({
      id: crypto.randomUUID(),
      createdAt: enquiry.createdAt,
      eventType: "enquiry",
      path: "/contact",
      course: enquiry.course,
      learnerType: enquiry.learnerType === "student" || enquiry.learnerType === "professional" ? enquiry.learnerType : null,
      device: "unknown",
      source: enquiry.kind,
      visitorId: null,
      sample: false,
    });
  } catch {
    return json({ ok: false, error: "We could not save your message. Please try again shortly." }, 503);
  }
  void mirrorEnquiry(enquiry).then(async (ok) => {
    if (ok) await getStore().updateEnquiry(enquiry.id, { sheetsSynced: true });
  });
  return json({ ok: true, id: enquiry.id, version: "v1" }, 201);
}

export async function postAnalytics(req: Request) {
  if (!assertSameOrigin(req)) return json({ ok: true });
  if (!rateLimit(`an:${clientIp(req)}`, 60, 60 * 1000)) return json({ ok: true });
  const body = await readJson(req, 4000);
  if (!body.ok) return json({ ok: false, error: body.error }, 400);
  const parsed = analyticsSchema.safeParse(body.data);
  if (!parsed.success) return json({ ok: false, error: "Ignored." }, 400);
  if (!parsed.data.path.startsWith("/") || parsed.data.path.startsWith("/admin")) return json({ ok: true });
  await getStore().recordEvent({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    eventType: parsed.data.eventType,
    path: parsed.data.path,
    course: parsed.data.course || null,
    learnerType: parsed.data.learnerType || null,
    device: parsed.data.device,
    source: parsed.data.source || null,
    visitorId: parsed.data.visitorId || null,
    sample: false,
  });
  return json({ ok: true });
}
