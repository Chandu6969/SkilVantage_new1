import crypto from "crypto";
import { formatStamp } from "@/lib/dates";
import { getProgram, programs, trackLabel } from "@/lib/content";
import type { CashBook, CashEntry, Enquiry, FollowUp, Registration } from "@/lib/types";

const TABS = [
  "Student Registrations",
  "Professional Registrations",
  "Course Enquiries",
  "Course List",
  "Follow-ups",
  "Cash Book",
] as const;

const STUDENT_HEADERS = [
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

const PROFESSIONAL_HEADERS = [
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

const ENQUIRY_HEADERS = [
  "Name",
  "Phone",
  "Email",
  "Course",
  "Learner Type",
  "Date",
  "Status",
  "Notes",
  "Message",
  "Kind",
  "Enquiry ID",
];

const COURSE_HEADERS = ["Course Name", "Description", "Duration", "Level", "Prerequisites", "Skills", "Status"];

const FOLLOW_HEADERS = [
  "Registration ID",
  "Name",
  "Phone",
  "Course",
  "Follow-up Date",
  "Counsellor",
  "Status",
  "Notes",
];

let lastError: string | null = null;
let lastSyncAt: string | null = null;
let tokenCache: { token: string; exp: number } | null = null;
let queue: Promise<unknown> = Promise.resolve();

function queued<T>(fn: () => Promise<T>) {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function cleanError(error: unknown) {
  const message = error instanceof Error ? error.message : "Sheets sync failed";
  lastError = message.replace(/private[_ ]key[\s\S]*/i, "private key").slice(0, 180);
  return lastError;
}

export function sheetsConfigured() {
  return Boolean(sheetId() && credentials());
}

export function sheetsStatus() {
  return {
    configured: sheetsConfigured(),
    lastError,
    lastSyncAt,
  };
}

function sheetId() {
  return process.env.GOOGLE_SHEET_ID?.trim() || "";
}

function credentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { client_email?: string; private_key?: string };
      if (parsed.client_email && parsed.private_key) {
        return { email: parsed.client_email, key: parsed.private_key.replace(/\\n/g, "\n") };
      }
    } catch {
      return null;
    }
  }
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  let key = process.env.GOOGLE_PRIVATE_KEY?.trim();
  if (!email || !key) return null;
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  return { email, key: key.replace(/\\n/g, "\n") };
}

async function accessToken() {
  if (tokenCache && tokenCache.exp > Date.now() + 60_000) return tokenCache.token;
  const creds = credentials();
  if (!creds) return null;
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(
    JSON.stringify({
      iss: creds.email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  ).toString("base64url");
  const unsigned = `${header}.${claim}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  const assertion = `${unsigned}.${signer.sign(creds.key).toString("base64url")}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const payload = (await response.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "Google token request failed");
  }
  tokenCache = { token: payload.access_token, exp: Date.now() + 50 * 60 * 1000 };
  return payload.access_token;
}

function valuesPath(range: string) {
  const bang = range.indexOf("!");
  if (bang < 0) return `/values/${encodeURIComponent(range)}`;
  return `/values/${encodeURIComponent(range.slice(0, bang))}!${range.slice(bang + 1)}`;
}

async function sheetsFetch(token: string, path: string, init?: RequestInit) {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const text = await response.text();
  const body = text ? (JSON.parse(text) as { error?: { message?: string } }) : {};
  if (!response.ok) throw new Error(body.error?.message || `Sheets request failed (${response.status})`);
  return body;
}

async function ensureTabs(token: string) {
  const meta = (await sheetsFetch(token, "?fields=sheets.properties.title")) as {
    sheets?: { properties?: { title?: string } }[];
  };
  const existing = new Set((meta.sheets || []).map((sheet) => sheet.properties?.title));
  const requests = TABS.filter((title) => !existing.has(title)).map((title) => ({ addSheet: { properties: { title } } }));
  if (requests.length) await sheetsFetch(token, ":batchUpdate", { method: "POST", body: JSON.stringify({ requests }) });
}

async function ensureHeader(token: string, tab: string, headers: string[]) {
  const path = valuesPath(`${tab}!A1:AF1`);
  const current = (await sheetsFetch(token, path)) as { values?: string[][] };
  const first = current.values?.[0] || [];
  if (first[0] === headers[0]) return;
  await sheetsFetch(token, `${path}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ values: [headers] }),
  });
}

async function append(token: string, tab: string, row: string[]) {
  const path = valuesPath(`${tab}!A1`);
  await sheetsFetch(token, `${path}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: JSON.stringify({ values: [row] }),
  });
}

async function findRow(token: string, tab: string, id: string) {
  const current = (await sheetsFetch(token, valuesPath(`${tab}!A:A`))) as { values?: string[][] };
  const values = current.values || [];
  const index = values.findIndex((row, rowIndex) => rowIndex > 0 && row[0] === id);
  return index >= 0 ? index + 1 : null;
}

async function writeRow(token: string, tab: string, rowNumber: number, row: string[]) {
  await sheetsFetch(token, `${valuesPath(`${tab}!A${rowNumber}`)}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ values: [row] }),
  });
}

function courseName(slug: string) {
  if (slug === "not-sure") return "Not sure";
  return getProgram(slug)?.name || slug;
}

export function studentRow(registration: Registration) {
  return [
    registration.id,
    formatStamp(registration.createdAt),
    registration.fullName,
    registration.gender,
    registration.phone,
    registration.email,
    registration.city,
    registration.state,
    registration.college,
    registration.degree,
    registration.branch,
    registration.passedOutYear,
    registration.skills,
    registration.programmingLanguages,
    registration.projects,
    registration.certifications,
    courseName(registration.program),
    registration.expectedPackage,
    registration.preferredRole,
    registration.opportunity,
    registration.learningMode,
    registration.availability,
    registration.source,
    registration.resumeName || "",
    registration.status,
    registration.counsellorNotes,
    registration.followUpDate || "",
    registration.currentYear,
    registration.tools,
    registration.linkedin,
    registration.github,
    trackLabel[registration.preferredTrack as keyof typeof trackLabel] || registration.preferredTrack,
  ];
}

export function professionalRow(registration: Registration) {
  return [
    registration.id,
    formatStamp(registration.createdAt),
    registration.fullName,
    registration.phone,
    registration.email,
    registration.city,
    registration.state,
    registration.company,
    registration.currentRole,
    registration.experience,
    registration.industry,
    registration.currentSkills,
    courseName(registration.program),
    registration.targetRole,
    registration.careerChangeReason,
    registration.currentPackage,
    registration.expectedPackage,
    registration.noticePeriod,
    registration.learningMode,
    registration.batchTiming,
    registration.linkedin,
    registration.github,
    registration.resumeName || "",
    registration.status,
    registration.counsellorNotes,
    registration.followUpDate || "",
    registration.previousExperience,
    registration.targetTrack,
  ];
}

function enquiryRow(enquiry: Enquiry) {
  return [
    enquiry.name,
    enquiry.phone,
    enquiry.email,
    courseName(enquiry.course),
    enquiry.learnerType,
    formatStamp(enquiry.createdAt),
    enquiry.status,
    enquiry.notes,
    enquiry.message,
    enquiry.kind,
    enquiry.id,
  ];
}

async function prepare(token: string) {
  await ensureTabs(token);
  await ensureHeader(token, "Student Registrations", STUDENT_HEADERS);
  await ensureHeader(token, "Professional Registrations", PROFESSIONAL_HEADERS);
  await ensureHeader(token, "Course Enquiries", ENQUIRY_HEADERS);
  await ensureHeader(token, "Follow-ups", FOLLOW_HEADERS);
  const rows = [
    COURSE_HEADERS,
    ...programs.map((program) => [
      program.name,
      program.description,
      program.duration,
      program.level,
      program.prerequisites.join("; "),
      program.skills.join(", "),
      "Active",
    ]),
  ];
  await sheetsFetch(token, `${valuesPath("Course List!A1:G20")}:clear`, { method: "POST" });
  await sheetsFetch(token, `${valuesPath("Course List!A1")}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ values: rows }),
  });
}

async function upsertRegistration(token: string, registration: Registration) {
  const tab = registration.learnerType === "student" ? "Student Registrations" : "Professional Registrations";
  const row = registration.learnerType === "student" ? studentRow(registration) : professionalRow(registration);
  const existing = await findRow(token, tab, registration.id);
  if (existing) await writeRow(token, tab, existing, row);
  else await append(token, tab, row);
}

export function mirrorRegistration(registration: Registration) {
  return queued(async () => {
    if (!sheetsConfigured() || registration.sample) return false;
    try {
      const token = await accessToken();
      if (!token) return false;
      await prepare(token);
      await upsertRegistration(token, registration);
      lastSyncAt = new Date().toISOString();
      lastError = null;
      return true;
    } catch (error) {
      cleanError(error);
      return false;
    }
  });
}

export function mirrorEnquiry(enquiry: Enquiry) {
  return queued(async () => {
    if (!sheetsConfigured() || enquiry.sample) return false;
    try {
      const token = await accessToken();
      if (!token) return false;
      await prepare(token);
      await append(token, "Course Enquiries", enquiryRow(enquiry));
      lastSyncAt = new Date().toISOString();
      lastError = null;
      return true;
    } catch (error) {
      cleanError(error);
      return false;
    }
  });
}

export function mirrorFollowUp(followUp: FollowUp) {
  return queued(async () => {
    if (!sheetsConfigured()) return false;
    try {
      const token = await accessToken();
      if (!token) return false;
      await prepare(token);
      await append(token, "Follow-ups", [
        followUp.registrationId,
        followUp.name,
        followUp.phone,
        followUp.course,
        followUp.followUpDate,
        followUp.counsellor,
        followUp.status,
        followUp.notes,
      ]);
      lastSyncAt = new Date().toISOString();
      lastError = null;
      return true;
    } catch (error) {
      cleanError(error);
      return false;
    }
  });
}

export async function mirrorCashBook(book: CashBook, entries: CashEntry[]) {
  if (!sheetsConfigured()) return false;
  return queued(async () => {
    const token = await accessToken();
    if (!token) return false;
    await ensureTabs(token);
    const rows = [
      ["Date", "Type", "Account", "Category", "Party", "Reference", "Mode", "Description", "Amount", "Created"],
      ["Opening", "", "Cash", "", "", "", "", "Opening cash balance", String(book.openingCash), book.updatedAt],
      ["Opening", "", "Bank", "", "", "", "", "Opening bank balance", String(book.openingBank), book.updatedAt],
      ...[...entries]
        .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
        .map((entry) => [
          entry.date,
          entry.flow,
          entry.account,
          entry.category,
          entry.party,
          entry.reference,
          entry.mode,
          entry.description,
          String(entry.flow === "out" || entry.flow === "transfer" ? -entry.amount : entry.amount),
          entry.createdAt,
        ]),
    ];
    await sheetsFetch(token, `${valuesPath("Cash Book!A1:J2000")}:clear`, { method: "POST" });
    await sheetsFetch(token, `${valuesPath("Cash Book!A1")}?valueInputOption=RAW`, {
      method: "PUT",
      body: JSON.stringify({ values: rows }),
    });
    lastSyncAt = new Date().toISOString();
    lastError = null;
    return true;
  });
}

export async function syncPending(records: Registration[], enquiries: Enquiry[]) {
  let synced = 0;
  for (const record of records.filter((item) => !item.sample && !item.sheetsSynced).slice(0, 40)) {
    if (await mirrorRegistration(record)) synced += 1;
  }
  for (const enquiry of enquiries.filter((item) => !item.sample && !item.sheetsSynced).slice(0, 40)) {
    if (await mirrorEnquiry(enquiry)) synced += 1;
  }
  return synced;
}
