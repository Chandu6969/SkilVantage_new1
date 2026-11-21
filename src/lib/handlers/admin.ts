import { getProgram, programs } from "@/lib/content";
import { formatStamp } from "@/lib/dates";
import { dashboardFrom, matchesLead, summarizeAnalytics } from "@/lib/metrics";
import { followUpFrom } from "@/lib/records";
import { mirrorEnquiry, mirrorFollowUp, mirrorRegistration, professionalRow, sheetsStatus, studentRow } from "@/lib/sheets";
import {
  adminConfigured,
  clearSessionCookie,
  roleForPassword,
  sessionCookie,
  sessionFromRequest,
} from "@/lib/auth";
import { assertSameOrigin, clientIp, json, rateLimit, readJson } from "@/lib/security";
import { getStore } from "@/lib/store";
import { toCsv, safeFilename } from "@/lib/text";
import { LEAD_STATUSES, type LeadFilters, type Registration } from "@/lib/types";
import { leadPatchSchema } from "@/lib/validation";

async function guard(req: Request, adminOnly = false) {
  if (!assertSameOrigin(req)) {
    return { error: json({ ok: false, error: "This action can only be taken from the SkilVantage site." }, 403) };
  }
  const session = await sessionFromRequest(req);
  if (!session) return { error: json({ ok: false, error: "Sign in required." }, 401) };
  if (adminOnly && session.role !== "admin") {
    return { error: json({ ok: false, error: "This action is limited to an admin." }, 403) };
  }
  return { session };
}

function filtersFrom(url: URL): LeadFilters {
  return {
    q: url.searchParams.get("q") || undefined,
    program: url.searchParams.get("program") || undefined,
    learnerType: url.searchParams.get("learnerType") || undefined,
    status: url.searchParams.get("status") || undefined,
    from: url.searchParams.get("from") || undefined,
    to: url.searchParams.get("to") || undefined,
    includeSample: url.searchParams.get("includeSample") === "1",
  };
}

export async function postLogin(req: Request) {
  if (!assertSameOrigin(req)) return json({ ok: false, error: "Sign-in was refused." }, 403);
  if (!rateLimit(`login:${clientIp(req)}`, 10, 15 * 60 * 1000)) {
    return json({ ok: false, error: "Too many sign-in attempts. Please wait and try again." }, 429);
  }
  if (!adminConfigured()) {
    return json({ ok: false, error: "Admin sign-in is not configured yet." }, 503);
  }
  const body = await readJson(req);
  if (!body.ok) return json({ ok: false, error: body.error }, 400);
  const password =
    body.data && typeof body.data === "object" && "password" in body.data
      ? String((body.data as { password?: unknown }).password || "")
      : "";
  const role = roleForPassword(password);
  if (!role) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return json({ ok: false, error: "That password is not correct." }, 401);
  }
  try {
    const session = await getStore().createSession(role);
    return json({ ok: true, role }, 200, { "Set-Cookie": sessionCookie(session.token) });
  } catch {
    return json({ ok: false, error: "Sign-in could not be saved. Try again." }, 503);
  }
}

export async function postLogout(req: Request) {
  if (!assertSameOrigin(req)) return json({ ok: false, error: "Sign-out was refused." }, 403);
  const token = req.headers.get("cookie") || "";
  const match = token.split(";").map((part) => part.trim()).find((part) => part.startsWith("sv_session="));
  if (match) await getStore().deleteSession(decodeURIComponent(match.slice("sv_session=".length)));
  return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie() });
}

export async function getSession(req: Request) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  return json({ ok: true, role: access.session.role });
}

export async function getStats(req: Request) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const store = getStore();
  const [registrations, enquiries, events] = await Promise.all([
    store.listRegistrations(),
    store.listEnquiries(),
    store.listEventsSince(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);
  return json({
    ok: true,
    dashboard: dashboardFrom(registrations, enquiries),
    analytics: summarizeAnalytics(events, registrations),
    sheets: sheetsStatus(),
    storage: store.kind,
    role: access.session.role,
  });
}

export async function getLeads(req: Request) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const url = new URL(req.url);
  const filters = filtersFrom(url);
  const rows = (await getStore().listRegistrations())
    .filter((item) => matchesLead(item, filters))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const limit = Math.min(Number(url.searchParams.get("limit") || 200), 500);
  return json({
    ok: true,
    total: rows.length,
    leads: rows.slice(0, limit).map(publicLead),
  });
}

export async function getLead(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const { id } = await ctx.params;
  const lead = await getStore().getRegistration(id);
  if (!lead) return json({ ok: false, error: "Registration not found." }, 404);
  return json({ ok: true, lead: publicLead(lead), role: access.session.role });
}

export async function patchLead(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const { id } = await ctx.params;
  const body = await readJson(req);
  if (!body.ok) return json({ ok: false, error: body.error }, 400);
  const parsed = leadPatchSchema.safeParse(body.data);
  if (!parsed.success) return json({ ok: false, error: "Check the update and try again." }, 400);
  const current = await getStore().getRegistration(id);
  if (!current) return json({ ok: false, error: "Registration not found." }, 404);
  const next = await getStore().updateRegistration(id, {
    status: parsed.data.status || current.status,
    counsellorNotes: parsed.data.counsellorNotes ?? current.counsellorNotes,
    followUpDate: parsed.data.followUpDate === undefined ? current.followUpDate : parsed.data.followUpDate,
    sheetsSynced: false,
  });
  if (!next) return json({ ok: false, error: "Registration not found." }, 404);
  if (parsed.data.followUpDate) {
    const follow = followUpFrom(next, parsed.data.counsellor || "Career team", parsed.data.followUpNotes || parsed.data.counsellorNotes || "");
    if (follow) {
      await getStore().insertFollowUp(follow);
      void mirrorFollowUp(follow);
    }
  }
  void mirrorRegistration(next).then(async (ok) => {
    if (ok) await getStore().updateRegistration(next.id, { sheetsSynced: true });
  });
  return json({ ok: true, lead: publicLead(next) });
}

export async function deleteLead(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const access = await guard(req, true);
  if ("error" in access) return access.error;
  const { id } = await ctx.params;
  const removed = await getStore().deleteRegistration(id);
  if (!removed) return json({ ok: false, error: "Registration not found." }, 404);
  return json({ ok: true });
}

export async function getEnquiries(req: Request) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const includeSample = url.searchParams.get("includeSample") === "1";
  const rows = (await getStore().listEnquiries())
    .filter((item) => includeSample || !item.sample)
    .filter((item) => {
      if (!q) return true;
      return [item.name, item.email, item.phone, item.course, item.message].join(" ").toLowerCase().includes(q);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return json({ ok: true, enquiries: rows.slice(0, 200) });
}

export async function patchEnquiry(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const { id } = await ctx.params;
  const body = await readJson(req);
  if (!body.ok) return json({ ok: false, error: body.error }, 400);
  const parsed = leadPatchSchema.safeParse(body.data);
  if (!parsed.success) return json({ ok: false, error: "Check the update and try again." }, 400);
  const next = await getStore().updateEnquiry(id, {
    ...(parsed.data.status ? { status: parsed.data.status } : {}),
    ...(parsed.data.counsellorNotes !== undefined ? { notes: parsed.data.counsellorNotes } : {}),
    sheetsSynced: false,
  });
  if (!next) return json({ ok: false, error: "Enquiry not found." }, 404);
  return json({ ok: true, enquiry: next });
}

export async function getExport(req: Request) {
  const access = await guard(req, true);
  if ("error" in access) return access.error;
  const url = new URL(req.url);
  const kind = url.searchParams.get("type") || "all";
  const rows = (await getStore().listRegistrations()).filter((item) => !item.sample || url.searchParams.get("includeSample") === "1");
  const students = rows.filter((item) => item.learnerType === "student");
  const professionals = rows.filter((item) => item.learnerType === "professional");
  let table: string[][] = [];
  let name = "skilvantage-leads.csv";
  if (kind === "students") {
    table = [studentHeaders(), ...students.map(studentRow)];
    name = "skilvantage-students.csv";
  } else if (kind === "professionals") {
    table = [professionalHeaders(), ...professionals.map(professionalRow)];
    name = "skilvantage-professionals.csv";
  } else if (kind === "enquiries") {
    const enquiries = (await getStore().listEnquiries()).filter((item) => !item.sample || url.searchParams.get("includeSample") === "1");
    table = [
      ["Enquiry ID", "Date", "Name", "Phone", "Email", "Course", "Learner Type", "Kind", "Status", "Message", "Notes"],
      ...enquiries.map((item) => [
        item.id,
        formatStamp(item.createdAt),
        item.name,
        item.phone,
        item.email,
        getProgram(item.course)?.name || item.course,
        item.learnerType,
        item.kind,
        item.status,
        item.message,
        item.notes,
      ]),
    ];
    name = "skilvantage-enquiries.csv";
  } else {
    table = [
      ["Registration ID", "Date", "Learner Type", "Name", "Phone", "Email", "Program", "Status", "City"],
      ...rows.map((item) => [
        item.id,
        formatStamp(item.createdAt),
        item.learnerType,
        item.fullName,
        item.phone,
        item.email,
        getProgram(item.program)?.name || item.program,
        item.status,
        item.city,
      ]),
    ];
  }
  return new Response(toCsv(table), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function getFile(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const { id } = await ctx.params;
  if (!/^SVR-[A-Z2-9]{8}$/.test(id)) return json({ ok: false, error: "File not found." }, 404);
  const file = await getStore().getFile(id);
  if (!file) return json({ ok: false, error: "File not found." }, 404);
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mime || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeFilename(file.filename).replace(/"/g, "")}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}

export async function getSheets(req: Request) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  return json({ ok: true, ...sheetsStatus(), storage: getStore().kind });
}

export async function postSheets(req: Request) {
  const access = await guard(req, true);
  if ("error" in access) return access.error;
  const store = getStore();
  const [registrations, enquiries] = await Promise.all([store.listRegistrations(), store.listEnquiries()]);
  let synced = 0;
  for (const record of registrations.filter((item) => !item.sample && !item.sheetsSynced).slice(0, 40)) {
    if (await mirrorRegistration(record)) {
      await store.updateRegistration(record.id, { sheetsSynced: true });
      synced += 1;
    }
  }
  for (const enquiry of enquiries.filter((item) => !item.sample && !item.sheetsSynced).slice(0, 40)) {
    if (await mirrorEnquiry(enquiry)) {
      await store.updateEnquiry(enquiry.id, { sheetsSynced: true });
      synced += 1;
    }
  }
  return json({ ok: true, synced, ...sheetsStatus() });
}

function publicLead(lead: Registration) {
  return {
    ...lead,
    createdLabel: formatStamp(lead.createdAt),
    programName: getProgram(lead.program)?.name || lead.program,
  };
}

function studentHeaders() {
  return [
    "Registration ID",
    "Date",
    "Name",
    "Gender",
    "Phone",
    "Email",
    "City",
    "State",
    "College",
    "Degree",
    "Branch",
    "Passed Out Year",
    "Skills",
    "Programming Languages",
    "Projects",
    "Certifications",
    "Selected Course",
    "Expected Package",
    "Preferred Role",
    "Internship/Job",
    "Learning Mode",
    "Availability",
    "Source",
    "Resume",
    "Status",
    "Counsellor Notes",
    "Follow-up Date",
    "Current Year",
    "Tools",
    "LinkedIn",
    "GitHub",
    "Preferred Track",
  ];
}

function professionalHeaders() {
  return [
    "Registration ID",
    "Date",
    "Name",
    "Phone",
    "Email",
    "City",
    "State",
    "Current Company",
    "Current Role",
    "Experience",
    "Industry",
    "Current Skills",
    "Selected Course",
    "Target Role",
    "Career Change Reason",
    "Current Package",
    "Expected Package",
    "Notice Period",
    "Learning Mode",
    "Batch Timing",
    "LinkedIn",
    "GitHub",
    "Resume",
    "Status",
    "Counsellor Notes",
    "Follow-up Date",
    "Previous Experience",
    "Target Track",
  ];
}

export const leadStatuses = LEAD_STATUSES;
export const programOptions = programs.map((program) => ({ slug: program.slug, name: program.name }));
