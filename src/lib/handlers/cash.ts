import { CASH_CATEGORIES, CASH_MODES } from "@/lib/cash-book";
import { cashEntryId } from "@/lib/ids";
import { mirrorCashBook, sheetsStatus } from "@/lib/sheets";
import { assertSameOrigin, json, readJson } from "@/lib/security";
import { getStore } from "@/lib/store";
import { sessionFromRequest } from "@/lib/auth";
import type { CashAccount, CashEntry, CashFlow } from "@/lib/types";

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
  if (!Number.isFinite(amount) || amount < 0 || amount > 100000000) return null;
  return Math.round(amount);
}

function text(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}

function entryFrom(data: Record<string, unknown>, createdAt: string, id: string): CashEntry | null {
  const date = day(data.date);
  const flow: CashFlow | "" = data.flow === "in" || data.flow === "out" || data.flow === "transfer" ? data.flow : "";
  const account: CashAccount | "" = data.account === "cash" || data.account === "bank" ? data.account : "";
  const category = text(data.category, 40);
  const mode = text(data.mode, 40);
  const amount = money(data.amount);
  if (!date || !flow || !account || amount === null || amount <= 0) return null;
  if (!CASH_CATEGORIES.includes(category as (typeof CASH_CATEGORIES)[number])) return null;
  if (!CASH_MODES.includes(mode as (typeof CASH_MODES)[number])) return null;
  return {
    id,
    date,
    flow,
    account,
    category,
    amount,
    party: text(data.party, 80),
    reference: text(data.reference, 80),
    mode,
    description: text(data.description, 240),
    createdAt,
  };
}

export async function postCashOpening(req: Request) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const body = await readJson(req);
  if (!body.ok || !body.data || typeof body.data !== "object") return json({ ok: false, error: "Check the opening balances." }, 400);
  const data = body.data as { openingCash?: unknown; openingBank?: unknown };
  const openingCash = money(data.openingCash);
  const openingBank = money(data.openingBank);
  if (openingCash === null || openingBank === null) return json({ ok: false, error: "Enter the opening cash and bank balances." }, 400);
  const book = await getStore().saveCashBook({ openingCash, openingBank });
  return json({ ok: true, book });
}

export async function postCashEntry(req: Request) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const body = await readJson(req);
  if (!body.ok || !body.data || typeof body.data !== "object") return json({ ok: false, error: "Check the transaction." }, 400);
  const entry = entryFrom(body.data as Record<string, unknown>, new Date().toISOString(), cashEntryId());
  if (!entry) return json({ ok: false, error: "Choose the date, type, account, category, and an amount above zero." }, 400);
  await getStore().addCashEntry(entry);
  return json({ ok: true, entry }, 201);
}

export async function patchCashEntry(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const { id } = await ctx.params;
  const body = await readJson(req);
  if (!body.ok || !body.data || typeof body.data !== "object") return json({ ok: false, error: "Check the transaction." }, 400);
  const current = (await getStore().listCashEntries()).find((item) => item.id === id);
  if (!current) return json({ ok: false, error: "That transaction is no longer in the book." }, 404);
  const next = entryFrom(body.data as Record<string, unknown>, current.createdAt, id);
  if (!next) return json({ ok: false, error: "Choose the date, type, account, category, and an amount above zero." }, 400);
  const saved = await getStore().updateCashEntry(id, {
    date: next.date,
    flow: next.flow,
    account: next.account,
    category: next.category,
    amount: next.amount,
    party: next.party,
    reference: next.reference,
    mode: next.mode,
    description: next.description,
  });
  if (!saved) return json({ ok: false, error: "That transaction is no longer in the book." }, 404);
  return json({ ok: true, entry: saved });
}

export async function deleteCashEntry(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const { id } = await ctx.params;
  const removed = await getStore().deleteCashEntry(id);
  if (!removed) return json({ ok: false, error: "That transaction is no longer in the book." }, 404);
  return json({ ok: true });
}

export async function postCashSync(req: Request) {
  const access = await guard(req);
  if ("error" in access) return access.error;
  const status = sheetsStatus();
  if (!status.configured) return json({ ok: true, configured: false, syncedAt: "" });
  const store = getStore();
  try {
    const [book, entries] = await Promise.all([store.getCashBook(), store.listCashEntries()]);
    const synced = await mirrorCashBook(book, entries);
    if (!synced) return json({ ok: true, configured: false, syncedAt: "" });
    const stamped = await store.markCashSynced(new Date().toISOString());
    return json({ ok: true, configured: true, syncedAt: stamped.syncedAt });
  } catch {
    return json({ ok: false, error: "Google Sheets did not accept the cash book." }, 502);
  }
}
