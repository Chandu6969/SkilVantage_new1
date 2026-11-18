"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, RefreshCw } from "lucide-react";
import { CASH_CATEGORIES, CASH_MODES, settleCash } from "@/lib/cash-book";
import { rupees } from "@/components/admin/desk-charts";
import { formatStamp, todayIST } from "@/lib/dates";
import type { CashAccount, CashBook, CashEntry, CashFlow } from "@/lib/types";

const field = "mt-1 h-11 w-full rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none placeholder:text-white/35";
const control = "h-11 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none placeholder:text-white/35";

const flowLabel: Record<CashFlow, string> = { in: "Inflow", out: "Outflow", transfer: "Transfer" };
const accountLabel: Record<CashAccount, string> = { cash: "Cash", bank: "Bank" };

export function CashBoard({
  book,
  entries,
  sheetsConfigured,
}: {
  book: CashBook;
  entries: CashEntry[];
  sheetsConfigured: boolean;
}) {
  const router = useRouter();
  const today = todayIST();
  const [openingCash, setOpeningCash] = useState(String(book.openingCash));
  const [openingBank, setOpeningBank] = useState(String(book.openingBank));
  const [editing, setEditing] = useState<CashEntry | null>(null);
  const [date, setDate] = useState(today);
  const [flow, setFlow] = useState<CashFlow>("in");
  const [account, setAccount] = useState<CashAccount>("bank");
  const [category, setCategory] = useState<string>(CASH_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [party, setParty] = useState("");
  const [reference, setReference] = useState("");
  const [mode, setMode] = useState<string>(CASH_MODES[2]);
  const [description, setDescription] = useState("");
  const [month, setMonth] = useState("");
  const [accountFilter, setAccountFilter] = useState<"all" | CashAccount>("all");
  const [flowFilter, setFlowFilter] = useState<"all" | CashFlow>("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState("");

  const months = useMemo(() => {
    const keys = new Set<string>([today.slice(0, 7)]);
    for (const entry of entries) if (/^\d{4}-\d{2}/.test(entry.date)) keys.add(entry.date.slice(0, 7));
    return [...keys].sort().reverse();
  }, [entries, today]);

  const snapshot = useMemo(
    () => settleCash(book, entries, { month, account: accountFilter, flow: flowFilter, query }),
    [accountFilter, book, entries, flowFilter, month, query],
  );

  function load(entry: CashEntry) {
    setEditing(entry);
    setDate(entry.date);
    setFlow(entry.flow);
    setAccount(entry.account);
    setCategory(entry.category);
    setAmount(String(entry.amount));
    setParty(entry.party);
    setReference(entry.reference);
    setMode(entry.mode);
    setDescription(entry.description);
    setError("");
  }

  function resetForm() {
    setEditing(null);
    setDate(today);
    setFlow("in");
    setAccount("bank");
    setCategory(CASH_CATEGORIES[0]);
    setAmount("");
    setParty("");
    setReference("");
    setMode(CASH_MODES[2]);
    setDescription("");
  }

  async function saveOpening(event: React.FormEvent) {
    event.preventDefault();
    setPending("opening");
    setError("");
    const response = await fetch("/api/v1/admin/cash/opening", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openingCash: Number(openingCash), openingBank: Number(openingBank) }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending("");
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not save the opening balances.");
      return;
    }
    setNotice("Opening balances saved. They stay out of income.");
    router.refresh();
  }

  async function saveEntry(event: React.FormEvent) {
    event.preventDefault();
    setPending("entry");
    setError("");
    const payload = { date, flow, account, category, amount: Number(amount), party, reference, mode, description };
    const response = await fetch(editing ? `/api/v1/admin/cash/entries/${editing.id}` : "/api/v1/admin/cash/entries", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending("");
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not save the transaction.");
      return;
    }
    resetForm();
    setNotice(editing ? "Transaction updated." : "Transaction added. Student records were left as they are.");
    router.refresh();
  }

  async function remove(entry: CashEntry) {
    const sure = window.confirm(`Delete this ${flowLabel[entry.flow].toLowerCase()} of ${rupees(entry.amount)} on ${entry.date}?`);
    if (!sure) return;
    setPending(entry.id);
    setError("");
    const response = await fetch(`/api/v1/admin/cash/entries/${entry.id}`, { method: "DELETE" });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending("");
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not delete the transaction.");
      return;
    }
    if (editing?.id === entry.id) resetForm();
    router.refresh();
  }

  async function sync() {
    setPending("sync");
    setError("");
    setNotice("");
    const response = await fetch("/api/v1/admin/cash/sync", { method: "POST" });
    const data = (await response.json()) as { ok?: boolean; error?: string; configured?: boolean };
    setPending("");
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not sync the cash book.");
      return;
    }
    setNotice(data.configured ? "Cash book copied to the Google Sheet." : "Saved on this desk. Google Sheets is not connected yet.");
    if (data.configured) router.refresh();
  }

  const synced = book.syncedAt ? `Google Sheets data loaded · ${formatStamp(book.syncedAt)}` : "Saved on this desk";

  return (
    <div className="grid min-w-0 gap-4">
      <header className="desk-hero" style={{ flexWrap: "wrap" }}>
        <div>
          <p className="desk-pill">Skilvantage · Finance</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Cash & Bank Book</h1>
          <p className="mt-2 max-w-xl text-sm text-white/85">Track money received, money spent, and the current Cash and Bank balances without changing your existing student records.</p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <p className="text-sm text-white/90">{synced}</p>
          <p className="w-fit rounded-full bg-black/20 px-3 py-1 text-xs font-medium text-white">{sheetsConfigured ? "Sheets sync: connected" : "Central copy: this desk"}</p>
          <button type="button" disabled={pending !== ""} onClick={() => void sync()} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-black/25 px-4 text-sm font-medium text-white disabled:opacity-60">
            <RefreshCw className="size-4" aria-hidden="true" />
            {pending === "sync" ? "Syncing…" : "Sync now"}
          </button>
        </div>
      </header>

      <section
        className="min-w-0 rounded-[28px] p-3 sm:p-5"
        style={{ color: "#f4f7f5", background: "#050505" }}
      >
        {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}
        {notice ? <p className="mb-3 text-sm text-emerald-300">{notice}</p> : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <MoneyCard title="Cash balance" value={rupees(snapshot.cash)} detail="Current cash in hand" from="#0f766e" to="#5eead4" />
          <MoneyCard title="Bank balance" value={rupees(snapshot.bank)} detail="Current bank balance" from="#1e3a8a" to="#93c5fd" />
          <MoneyCard title="Total balance" value={rupees(snapshot.total)} detail="Cash + Bank" from="#312e81" to="#c4b5fd" />
          <MoneyCard title="This period inflow" value={rupees(snapshot.periodIn)} detail={month ? monthTitle(month) : "All months"} from="#065f46" to="#6ee7b7" />
          <MoneyCard title="This period outflow" value={rupees(snapshot.periodOut)} detail={month ? monthTitle(month) : "All months"} from="#9f1239" to="#fda4af" />
          <MoneyCard title="Net cash flow" value={rupees(snapshot.net)} detail={snapshot.net >= 0 ? "Positive flow" : "More spent than received"} from="#9a3412" to="#fdba74" />
        </div>

        <article className="mt-4 rounded-3xl p-4 sm:p-5" style={glass}>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-lg font-semibold">Opening balances</h2>
            <p className="text-sm text-white/55">Set these once to start the book. They are not counted as income.</p>
          </div>
          <form onSubmit={saveOpening} className="mt-4 grid gap-3 lg:grid-cols-2">
            <label className="rounded-2xl border border-white/10 bg-black p-3 text-sm">
              <span className="flex items-center justify-between gap-3">
                <span className="font-medium">Cash in hand</span>
                <span className="text-lg font-semibold text-[#5eead4]">{rupees(snapshot.cash)}</span>
              </span>
              <input value={openingCash} onChange={(event) => setOpeningCash(event.target.value)} inputMode="decimal" aria-label="Opening cash balance" className={field} />
            </label>
            <label className="rounded-2xl border border-white/10 bg-black p-3 text-sm">
              <span className="flex items-center justify-between gap-3">
                <span className="font-medium">Bank balance</span>
                <span className="text-lg font-semibold text-[#93c5fd]">{rupees(snapshot.bank)}</span>
              </span>
              <input value={openingBank} onChange={(event) => setOpeningBank(event.target.value)} inputMode="decimal" aria-label="Opening bank balance" className={field} />
            </label>
            <div className="lg:col-span-2 lg:text-right">
              <button type="submit" disabled={pending !== ""} className="h-11 rounded-xl bg-[#0f766e] px-4 text-sm font-medium text-white disabled:opacity-60">
                {pending === "opening" ? "Saving…" : "Save opening balances"}
              </button>
            </div>
          </form>
        </article>

        <article className="mt-4 rounded-3xl p-4 sm:p-5" style={glass}>
          <h2 className="text-lg font-semibold">{editing ? "Edit transaction" : "Add transaction"}</h2>
          <form onSubmit={saveEntry} className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-semibold tracking-[0.12em] text-white/55 uppercase">Date
              <input type="date" required value={date} onChange={(event) => setDate(event.target.value)} className={field} style={{ colorScheme: "dark" }} />
            </label>
            <label className="text-xs font-semibold tracking-[0.12em] text-white/55 uppercase">Type
              <select value={flow} onChange={(event) => setFlow(event.target.value as CashFlow)} className={field} style={{ colorScheme: "dark" }}>
                <option value="in">Inflow / Money in</option>
                <option value="out">Outflow / Money out</option>
                <option value="transfer">Transfer between cash and bank</option>
              </select>
            </label>
            <label className="text-xs font-semibold tracking-[0.12em] text-white/55 uppercase">{flow === "transfer" ? "From account" : "Account"}
              <select value={account} onChange={(event) => setAccount(event.target.value as CashAccount)} className={field} style={{ colorScheme: "dark" }}>
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
              </select>
            </label>
            <label className="text-xs font-semibold tracking-[0.12em] text-white/55 uppercase">Category
              <select value={category} onChange={(event) => setCategory(event.target.value)} className={field} style={{ colorScheme: "dark" }}>
                {CASH_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold tracking-[0.12em] text-white/55 uppercase">Amount (₹)
              <input required value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="0" className={field} />
            </label>
            <label className="text-xs font-semibold tracking-[0.12em] text-white/55 uppercase">From / to
              <input value={party} onChange={(event) => setParty(event.target.value)} placeholder="Student, teacher, vendor" className={field} />
            </label>
            <label className="text-xs font-semibold tracking-[0.12em] text-white/55 uppercase">Reference
              <input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Receipt / UTR / invoice no." className={field} />
            </label>
            <label className="text-xs font-semibold tracking-[0.12em] text-white/55 uppercase">Payment mode
              <select value={mode} onChange={(event) => setMode(event.target.value)} className={field} style={{ colorScheme: "dark" }}>
                {CASH_MODES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold tracking-[0.12em] text-white/55 uppercase sm:col-span-2 xl:col-span-4">Description
              <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="September course fee, internet bill, teacher payment" className={field} />
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-4 xl:justify-end">
              {editing ? <button type="button" onClick={resetForm} className="h-11 rounded-xl border border-white/15 bg-black px-4 text-sm text-white">Cancel edit</button> : null}
              <button type="submit" disabled={pending !== ""} className="h-11 rounded-xl bg-[#0f766e] px-4 text-sm font-medium text-white disabled:opacity-60">
                {pending === "entry" ? "Saving…" : editing ? "Save transaction" : "Add transaction"}
              </button>
            </div>
          </form>
        </article>

        <article className="mt-4 min-w-0 overflow-hidden rounded-3xl" style={glass}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
            <h2 className="text-lg font-semibold">Transactions</h2>
            <a href={`/admin/print?section=cash${month ? `&month=${month}` : ""}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-black px-3 text-sm font-medium text-white">
              <Printer className="size-4" aria-hidden="true" />
              Print
            </a>
          </div>
          <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2 xl:grid-cols-[1.4fr_repeat(3,0.8fr)_auto] sm:px-5">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search description, party or reference" className={control} />
            <select value={month} onChange={(event) => setMonth(event.target.value)} aria-label="Month" className={control} style={{ colorScheme: "dark" }}>
              <option value="">All months</option>
              {months.map((key) => <option key={key} value={key}>{monthTitle(key)}</option>)}
            </select>
            <select value={accountFilter} onChange={(event) => setAccountFilter(event.target.value as "all" | CashAccount)} aria-label="Account" className={control} style={{ colorScheme: "dark" }}>
              <option value="all">All accounts</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
            </select>
            <select value={flowFilter} onChange={(event) => setFlowFilter(event.target.value as "all" | CashFlow)} aria-label="Type" className={control} style={{ colorScheme: "dark" }}>
              <option value="all">All types</option>
              <option value="in">Inflow</option>
              <option value="out">Outflow</option>
              <option value="transfer">Transfer</option>
            </select>
            <button type="button" onClick={() => { setQuery(""); setMonth(""); setAccountFilter("all"); setFlowFilter("all"); }} className="h-11 rounded-xl bg-[#0f766e] px-4 text-sm font-medium text-white">Clear</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="bg-[#0f766e] text-xs tracking-wide text-white uppercase">
                <tr>
                  {["Date", "Type", "Account", "Category", "Description", "From / to", "Reference", "Payment mode", "Amount", "Balance before", "Running balance", "Action"].map((heading) => (
                    <th key={heading} className="px-3 py-3 font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {snapshot.rows.map((row) => (
                  <tr key={row.entry.id} className="border-t border-white/10">
                    <td className="px-3 py-3 whitespace-nowrap">{dayLabel(row.entry.date)}</td>
                    <td className="px-3 py-3"><Pill flow={row.entry.flow} /></td>
                    <td className="px-3 py-3">{accountLabel[row.entry.account]}{row.entry.flow === "transfer" ? ` → ${accountLabel[row.entry.account === "cash" ? "bank" : "cash"]}` : ""}</td>
                    <td className="px-3 py-3">{row.entry.category}</td>
                    <td className="px-3 py-3">{row.entry.description || "—"}</td>
                    <td className="px-3 py-3">{row.entry.party || "—"}</td>
                    <td className="px-3 py-3">{row.entry.reference || "—"}</td>
                    <td className="px-3 py-3">{row.entry.mode}</td>
                    <td className={`px-3 py-3 font-medium whitespace-nowrap ${row.entry.flow === "out" ? "text-rose-300" : "text-emerald-300"}`}>{signed(row.entry)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{rupees(row.before)}</td>
                    <td className="px-3 py-3 font-medium whitespace-nowrap">{rupees(row.after)}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => load(row.entry)} className="text-sm font-medium text-emerald-300">Edit</button>
                        <button type="button" disabled={pending !== ""} onClick={() => void remove(row.entry)} className="text-sm font-medium text-rose-300">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {snapshot.rows.length === 0 ? <p className="px-5 py-8 text-sm text-white/55">No transactions for this filter. Add the first receipt or expense above.</p> : null}
          </div>
          <p className="px-5 py-4 text-xs leading-5 text-white/50">Balances follow the selected account. All accounts uses Cash and Bank together. A month starts from the previous month’s closing balance. A transfer moves money between cash and bank and is not income or an expense.</p>
        </article>
      </section>
    </div>
  );
}

const glass = {
  background: "#111111",
  border: "1px solid rgb(255 255 255 / 0.08)",
} as const;

function MoneyCard({ title, value, detail, to }: { title: string; value: string; detail: string; from: string; to: string }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-black p-4">
      <p className="text-xs font-semibold tracking-[0.12em] text-white/45 uppercase">{title}</p>
      <p className="mt-2 text-2xl font-semibold" style={{ color: to }}>{value}</p>
      <p className="mt-2 text-sm text-white/55">{detail}</p>
    </article>
  );
}

function Pill({ flow }: { flow: CashFlow }) {
  const tone = flow === "in" ? "bg-emerald-400/15 text-emerald-200" : flow === "out" ? "bg-rose-400/15 text-rose-200" : "bg-indigo-400/15 text-indigo-200";
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${tone}`}>{flowLabel[flow]}</span>;
}

function signed(entry: CashEntry) {
  if (entry.flow === "transfer") return rupees(entry.amount);
  return `${entry.flow === "out" ? "−" : "+"}${rupees(entry.amount)}`;
}

function dayLabel(iso: string) {
  const [year, month, date] = iso.split("-").map(Number);
  if (!year || !month || !date) return iso;
  return new Date(Date.UTC(year, month - 1, date)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

function monthTitle(key: string) {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
}
