import crypto from "crypto";
import { getStore } from "@/lib/store";
import { safeEqual } from "@/lib/security";

function sign(secret: string, body: string) {
  return crypto.createHmac("sha256", secret).update(body).digest("base64url");
}

export async function issueChallenge() {
  const a = crypto.randomInt(2, 10);
  const b = crypto.randomInt(2, 10);
  const nonce = crypto.randomBytes(8).toString("hex");
  const secret = await getStore().getSecret("formSecret");
  const iat = Date.now();
  const body = Buffer.from(
    JSON.stringify({
      iat,
      exp: iat + 30 * 60 * 1000,
      nonce,
      ah: crypto.createHash("sha256").update(`${a + b}|${nonce}|${secret}`).digest("base64url"),
    }),
  ).toString("base64url");
  return { token: `${body}.${sign(secret, body)}`, question: `What is ${a} + ${b}?` };
}

export async function verifyChallenge(token: string, answer: string, minAgeMs = 800) {
  const secret = await getStore().getSecret("formSecret");
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false as const, error: "Refresh the spam check and try again." };
  const [body, signature] = parts;
  if (!body || !signature || !safeEqual(sign(secret, body), signature)) {
    return { ok: false as const, error: "Refresh the spam check and try again." };
  }
  let payload: { iat?: number; exp?: number; nonce?: string; ah?: string };
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { ok: false as const, error: "Refresh the spam check and try again." };
  }
  if (!payload.iat || !payload.exp || !payload.nonce || !payload.ah) {
    return { ok: false as const, error: "Refresh the spam check and try again." };
  }
  if (Date.now() > payload.exp) {
    return { ok: false as const, error: "The spam check expired. Please try again." };
  }
  if (Date.now() - payload.iat < minAgeMs) {
    return { ok: false as const, error: "Please wait a moment and submit again." };
  }
  const answerHash = crypto
    .createHash("sha256")
    .update(`${answer.trim()}|${payload.nonce}|${secret}`)
    .digest("base64url");
  if (!safeEqual(answerHash, payload.ah)) {
    return { ok: false as const, error: "The spam check answer is not correct." };
  }
  return { ok: true as const };
}
