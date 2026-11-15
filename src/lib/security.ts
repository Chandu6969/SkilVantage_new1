import crypto from "crypto";

const hits = new Map<string, number[]>();

export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim().slice(0, 64);
  return req.headers.get("x-real-ip")?.slice(0, 64) || "local";
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (hits.size > 5000) hits.clear();
  const recent = (hits.get(key) || []).filter((stamp) => now - stamp < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

export function safeEqual(a: string, b: string) {
  const left = crypto.createHash("sha256").update(a).digest();
  const right = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(left, right);
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function assertSameOrigin(req: Request) {
  if (req.headers.get("authorization")?.startsWith("Bearer ")) return true;
  const site = req.headers.get("sec-fetch-site");
  if (site === "same-origin") return true;
  if (site === "cross-site") return false;
  const origin = req.headers.get("origin");
  if (!origin) return false;
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const hosts = new Set<string>();
  try {
    hosts.add(new URL(req.url).host);
  } catch {
    /* ignore malformed url */
  }
  for (const header of [req.headers.get("host"), req.headers.get("x-forwarded-host")]) {
    if (!header) continue;
    for (const part of header.split(",")) hosts.add(part.trim());
  }
  return hosts.has(originHost);
}

export function usableSecret(value: string | undefined) {
  return Boolean(value && value.length >= 8);
}

export function sniffResume(filename: string, mime: string, bytes: Buffer) {
  if (bytes.length > 5 * 1024 * 1024) {
    return { ok: false as const, error: "Resume must be 5 MB or smaller." };
  }
  if (bytes.length < 8) return { ok: false as const, error: "That file looks empty." };
  const ext = filename.toLowerCase().split(".").pop() || "";
  if (!["pdf", "doc", "docx"].includes(ext)) {
    return { ok: false as const, error: "Upload a PDF, DOC, or DOCX resume." };
  }
  const allowed = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
    "",
  ]);
  if (!allowed.has(mime)) {
    return { ok: false as const, error: "Upload a PDF, DOC, or DOCX resume." };
  }
  if (ext === "pdf" && bytes.subarray(0, 4).toString() !== "%PDF") {
    return { ok: false as const, error: "That PDF could not be read." };
  }
  if (ext === "docx" && (bytes[0] !== 0x50 || bytes[1] !== 0x4b)) {
    return { ok: false as const, error: "That DOCX could not be read." };
  }
  if (ext === "doc" && (bytes[0] !== 0xd0 || bytes[1] !== 0xcf)) {
    return { ok: false as const, error: "That DOC could not be read." };
  }
  return { ok: true as const };
}

export function json(body: unknown, status = 200, extra?: HeadersInit) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...Object.fromEntries(new Headers(extra)) },
  });
}

export async function readJson(req: Request, max = 100_000) {
  const length = Number(req.headers.get("content-length") || 0);
  if (length > max) return { ok: false as const, error: "That submission is too large." };
  const text = await req.text();
  if (text.length > max) return { ok: false as const, error: "That submission is too large." };
  try {
    return { ok: true as const, data: JSON.parse(text) as unknown };
  } catch {
    return { ok: false as const, error: "The form could not be read." };
  }
}
