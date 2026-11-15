import { cookies } from "next/headers";
import { getStore } from "@/lib/store";
import { safeEqual, usableSecret } from "@/lib/security";
import type { Session } from "@/lib/types";

export function tokenFromRequest(req: Request) {
  const authorization = req.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7).trim();
  const header = req.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "sv_session") return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function sessionFromRequest(req: Request): Promise<Session | null> {
  const token = tokenFromRequest(req);
  if (!token) return null;
  return getStore().getSession(token);
}

export async function currentSession() {
  const token = (await cookies()).get("sv_session")?.value;
  if (!token) return null;
  return getStore().getSession(token);
}

export function sessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `sv_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 12}${secure}`;
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `sv_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`;
}

export function adminConfigured() {
  return usableSecret(process.env.ADMIN_PASSWORD) || usableSecret(process.env.COUNSELLOR_PASSWORD);
}

export function roleForPassword(password: string): Session["role"] | null {
  const admin = process.env.ADMIN_PASSWORD || "";
  const counsellor = process.env.COUNSELLOR_PASSWORD || "";
  if (usableSecret(admin) && safeEqual(password, admin)) return "admin";
  if (usableSecret(counsellor) && safeEqual(password, counsellor)) return "counsellor";
  return null;
}
