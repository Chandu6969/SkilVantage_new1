"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import { CASH_CATEGORIES, CASH_MODES, settleCash } from "@/lib/cash-book";
import { rupees } from "@/components/admin/desk-charts";
import { todayIST } from "@/lib/dates";
import type { CashAccount, CashBook, CashEntry, CashFlow, LearnerType } from "@/lib/types";

const field = "cash-field mt-1 h-11 w-full rounded-xl border px-3 text-sm outline-none";
const control = "cash-field h-11 rounded-xl border px-3 text-sm outline-none";

type BatchOption = { id: string; name: string; learnerType: LearnerType };
type PersonOption = { id: string; batchId: string; fullName: string };
type TeacherOption = { id: string; fullName: string };

function categoryKind(category: string): "student" | "professional" | "teacher" | "other" {
  if (category === "Student Fee") return "student";
  if (category === "Professional Fee") return "professional";
  if (category === "Teacher Payment") return "teacher";
  return "other";
}

const flowLabel: Record<CashFlow, string> = { in: "Inflow", out: "Outflow", transfer: "Transfer" };
const accountLabel: Record<CashAccount, string> = { cash: "Cash", bank: "Bank" };

export function CashBoard({ book, entries, batches, people, teachers }: { book: CashBook; entries: CashEntry[]; batches: BatchOption[]; people: PersonOption[]; teachers: TeacherOption[] }) {
  const router = useRouter();
  const today = todayIST();
  const [openingCash, setOpeningCash] = useState(String(book.openingCash));
  const [openingBank, setOpeningBank] = useState(String(book.openingBank));
  const [editing, setEditing] = useState<CashEntry | null>(null);
  const [date, setDate] = useState(today);
  const [flow, setFlow] = useState<CashFlow>("in");
  const [account, setAccount] = useState<CashAccount>("bank");
  const [category, setCategory] = useState<string>(CASH_CATEGORIES[0]);
  const [batchId, setBatchId] = useState("");
  const [partyId, setPartyId] = useState("");
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

  const kind = categoryKind(category);
  const batchChoices = batches.filter((batch) => batch.learnerType === kind);
  const roster = people
    .filter((person) => person.batchId === batchId)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
  const teacherChoices = [...teachers].sort((a, b) => a.fullName.localeCompare(b.fullName));

  function chooseCategory(next: string) {
    const nextKind = categoryKind(next);
    setCategory(next);
    setBatchId("");
    setPartyId("");
    setParty("");
    if (nextKind === "student" || nextKind === "professional") setFlow("in");
    if (nextKind === "teacher") setFlow("out");
  }

  function chooseBatch(next: string) {
    setBatchId(next);
    setPartyId("");
    setParty("");
  }

  function choosePerson(id: string, list: { id: string; fullName: string }[]) {
    if (id === "kept") return;
    const person = list.find((item) => item.id === id);
    setPartyId(id);
    setParty(person?.fullName || "");
  }

  function load(entry: CashEntry) {
    const entryKind = categoryKind(entry.category);
    const person = people.find((item) => item.fullName === entry.party && batches.find((batch) => batch.id === item.batchId)?.learnerType === entryKind);
    const teacher = teachers.find((item) => item.fullName === entry.party);
    setEditing(entry);
    setDate(entry.date);
    setFlow(entry.flow);
    setAccount(entry.account);
    setCategory(entry.category);
    setBatchId(person?.batchId || "");
    setPartyId(entryKind === "teacher" ? teacher?.id || "" : person?.id || "");
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
    setBatchId("");
    setPartyId("");
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
    setError("");
    if ((kind === "student" || kind === "professional") && !batchId) {
      setError("Choose the batch first.");
      return;
    }
    if (kind !== "other" && !party.trim()) {
      setError(kind === "teacher" ? "Choose the teacher." : "Choose the name.");
      return;
    }
    setPending("entry");
    const payload = {
      date,
      flow,
      account,
      category,
      amount: Number(amount),
      party,
      reference,
      mode,
      description,
      memberId: asksBatch ? partyId : "",
      batchId: asksBatch ? batchId : "",
    };
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

  const asksBatch = kind === "student" || kind === "professional";
  const noun = kind === "professional" ? "professional" : "student";

  return (
    <div className="cash-book -mx-3 -my-4 grid min-h-[calc(100dvh-2rem)] min-w-0 content-start gap-4 px-3 py-4 sm:-mx-5 sm:-my-5 sm:px-5 sm:py-5 lg:-mx-6 lg:px-6">
      <header className="desk-hero" style={{ flexWrap: "wrap" }}>
        <div>
          <p className="desk-pill">SkilVantage · Finance</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Cash & Bank Book</h1>
          <p className="mt-2 max-w-xl text-sm text-white/85">Track money received, money spent, and the current Cash and Bank balances without changing your existing student records.</p>
        </div>
      </header>
      <article className="cash-card rounded-[28px] border px-5 py-6 sm:px-8 sm:py-8">
        <p className="cash-muted text-xs font-semibold tracking-[0.16em] uppercase">Total balance</p>
        <p className="cash-total mt-2 text-5xl font-bold tracking-tight sm:text-6xl">{rupees(snapshot.total)}</p>
        <p className="cash-muted mt-3 text-sm">Cash {rupees(snapshot.cash)} · Bank {rupees(snapshot.bank)}</p>
      </article>
      <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MoneyCard title="Cash balance" value={rupees(snapshot.cash)} detail="Current cash in hand" tone="cash-num-cash" />
        <MoneyCard title="Bank balance" value={rupees(snapshot.bank)} detail="Current bank balance" tone="cash-num-bank" />
        <MoneyCard title="This period inflow" value={rupees(snapshot.periodIn)} detail={month ? monthTitle(month) : "All months"} tone="cash-num-in" single />
        <MoneyCard title="This period outflow" value={rupees(snapshot.periodOut)} detail={month ? monthTitle(month) : "All months"} tone="cash-num-out" single />
        <MoneyCard title="Net cash flow" value={rupees(snapshot.net)} detail={snapshot.net >= 0 ? "Positive flow" : "More spent than received"} tone="cash-num-net" />
      </div>

      <section className="cash-panel min-w-0 rounded-[28px] border p-3 sm:p-5">
        {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
        {notice ? <p className="mb-3 text-sm text-emerald-700">{notice}</p> : null}

        <article className="rounded-3xl p-4 sm:p-5" style={glass}>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-lg font-semibold">Opening balances</h2>
            <p className="cash-muted text-sm">Set these once to start the book. They are not counted as income.</p>
          </div>
          <form onSubmit={saveOpening} className="mt-4 grid gap-3 lg:grid-cols-2">
            <label className="cash-card rounded-2xl border p-3 text-sm">
              <span className="flex items-center justify-between gap-3">
                <span className="font-medium">Cash in hand</span>
                <span className="cash-num-cash text-lg font-bold">{rupees(snapshot.cash)}</span>
              </span>
              <input value={openingCash} onChange={(event) => setOpeningCash(event.target.value)} inputMode="decimal" aria-label="Opening cash balance" className={field} />
            </label>
            <label className="cash-card rounded-2xl border p-3 text-sm">
              <span className="flex items-center justify-between gap-3">
                <span className="font-medium">Bank balance</span>
                <span className="cash-num-bank text-lg font-bold">{rupees(snapshot.bank)}</span>
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
          <form onSubmit={saveEntry} className="mt-4 grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="Date">
              <input type="date" required value={date} onChange={(event) => setDate(event.target.value)} className={field} />
            </Field>
            <Field label="Type">
              <select value={flow} onChange={(event) => setFlow(event.target.value as CashFlow)} className={field}>
                <option value="in">Inflow / Money in</option>
                <option value="out">Outflow / Money out</option>
                <option value="transfer">Transfer between cash and bank</option>
              </select>
            </Field>
            <Field label={flow === "transfer" ? "From account" : "Account"}>
              <select value={account} onChange={(event) => setAccount(event.target.value as CashAccount)} className={field}>
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
              </select>
            </Field>
            <Field label="Category">
              <select value={category} onChange={(event) => chooseCategory(event.target.value)} className={field}>
                {CASH_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Batch">
              <select value={asksBatch ? batchId : ""} disabled={!asksBatch} onChange={(event) => chooseBatch(event.target.value)} aria-label="Batch" className={`${field} disabled:opacity-70`}>
                <option value="">{asksBatch ? "Choose a batch" : "Not used for this category"}</option>
                {asksBatch ? batchChoices.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>) : null}
              </select>
            </Field>
            <Field label="From / to">
              {kind === "teacher" ? (
                <select required value={partyId || (party ? "kept" : "")} onChange={(event) => choosePerson(event.target.value, teacherChoices)} aria-label="Teacher" className={field}>
                  <option value="">{teacherChoices.length ? "Choose a teacher" : "No teachers yet"}</option>
                  {teacherChoices.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}
                  {party && !partyId ? <option value="kept">{party}</option> : null}
                </select>
              ) : asksBatch ? (
                <select required={Boolean(batchId)} value={partyId || (party ? "kept" : "")} disabled={!batchId} onChange={(event) => choosePerson(event.target.value, roster)} aria-label={noun === "student" ? "Student" : "Professional"} className={`${field} disabled:opacity-70`}>
                  <option value="">{batchId ? `Choose a ${noun}` : "Choose a batch first"}</option>
                  {roster.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}
                  {party && !partyId ? <option value="kept">{party}</option> : null}
                </select>
              ) : (
                <input value={party} onChange={(event) => { setPartyId(""); setParty(event.target.value); }} placeholder="Student, teacher, vendor" className={field} />
              )}
            </Field>
            <Field label="Amount (₹)">
              <input required value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="0" className={field} />
            </Field>
            <Field label="Payment mode">
              <select value={mode} onChange={(event) => setMode(event.target.value)} className={field}>
                {CASH_MODES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Reference">
              <input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Receipt / UTR / invoice no." className={field} />
            </Field>
            <Field label="Description" className="sm:col-span-2 xl:col-span-3">
              <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="September course fee, internet bill, teacher payment" className={field} />
            </Field>
            <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-4 xl:justify-end">
              {editing ? <button type="button" onClick={resetForm} className="cash-field h-11 rounded-xl border px-4 text-sm">Cancel edit</button> : null}
              <button type="submit" disabled={pending !== ""} className="h-11 rounded-xl bg-[#0f766e] px-4 text-sm font-medium text-white disabled:opacity-60">
                {pending === "entry" ? "Saving…" : editing ? "Save transaction" : "Add transaction"}
              </button>
            </div>
          </form>
        </article>

        <article className="mt-4 min-w-0 overflow-hidden rounded-3xl" style={glass}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
            <h2 className="text-lg font-semibold">Transactions</h2>
            <a href={`/admin/print?section=cash${month ? `&month=${month}` : ""}`} className="cash-field inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium">
              <Printer className="size-4" aria-hidden="true" />
              Print
            </a>
          </div>
          <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2 xl:grid-cols-[1.4fr_repeat(3,0.8fr)_auto] sm:px-5">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search description, party or reference" className={control} />
            <select value={month} onChange={(event) => setMonth(event.target.value)} aria-label="Month" className={control}>
              <option value="">All months</option>
              {months.map((key) => <option key={key} value={key}>{monthTitle(key)}</option>)}
            </select>
            <select value={accountFilter} onChange={(event) => setAccountFilter(event.target.value as "all" | CashAccount)} aria-label="Account" className={control}>
              <option value="all">All accounts</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
            </select>
            <select value={flowFilter} onChange={(event) => setFlowFilter(event.target.value as "all" | CashFlow)} aria-label="Type" className={control}>
              <option value="all">All types</option>
              <option value="in">Inflow</option>
              <option value="out">Outflow</option>
              <option value="transfer">Transfer</option>
            </select>
            <button type="button" onClick={() => { setQuery(""); setMonth(""); setAccountFilter("all"); setFlowFilter("all"); }} className="h-11 rounded-xl bg-[#0f766e] px-4 text-sm font-medium text-white">Clear</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="bg-[#14967c] text-xs tracking-wide text-white uppercase">
                <tr>
                  {["Date", "Type", "Account", "Category", "Description", "From / to", "Reference", "Payment mode", "Amount", "Balance before", "Running balance", "Action"].map((heading) => (
                    <th key={heading} className="px-3 py-3 font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {snapshot.rows.map((row) => (
                  <tr key={row.entry.id} className="border-t border-[var(--cash-line)]">
                    <td className="px-3 py-3 whitespace-nowrap">{dayLabel(row.entry.date)}</td>
                    <td className="px-3 py-3"><Pill flow={row.entry.flow} /></td>
                    <td className="px-3 py-3">{accountLabel[row.entry.account]}{row.entry.flow === "transfer" ? ` → ${accountLabel[row.entry.account === "cash" ? "bank" : "cash"]}` : ""}</td>
                    <td className="px-3 py-3">{row.entry.category}</td>
                    <td className="px-3 py-3">{row.entry.description || "—"}</td>
                    <td className="px-3 py-3">{row.entry.party || "—"}</td>
                    <td className="px-3 py-3">{row.entry.reference || "—"}</td>
                    <td className="px-3 py-3">{row.entry.mode}</td>
                    <td className={`px-3 py-3 font-bold whitespace-nowrap ${row.entry.flow === "out" ? "cash-num-out" : "cash-num-in"}`}>{signed(row.entry)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{rupees(row.before)}</td>
                    <td className="px-3 py-3 font-medium whitespace-nowrap">{rupees(row.after)}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => load(row.entry)} className="text-sm font-medium text-emerald-800">Edit</button>
                        <button type="button" disabled={pending !== ""} onClick={() => void remove(row.entry)} className="text-sm font-medium text-rose-700">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {snapshot.rows.length === 0 ? <p className="cash-muted px-5 py-8 text-sm">No transactions for this filter. Add the first receipt or expense above.</p> : null}
          </div>
          <p className="cash-muted px-5 py-4 text-xs leading-5">Balances follow the selected account. All accounts uses Cash and Bank together. A month starts from the previous month’s closing balance. A transfer moves money between cash and bank and is not income or an expense.</p>
        </article>
      </section>
    </div>
  );
}

const glass = {
  background: "var(--cash-card)",
  border: "1px solid var(--cash-line)",
} as const;

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`cash-label flex h-full flex-col justify-end text-xs font-semibold tracking-[0.12em] uppercase ${className}`}>
      <span className="min-h-4">{label}</span>
      {children}
    </label>
  );
}

function MoneyCard({ title, value, detail, tone, single = false }: { title: string; value: string; detail: string; tone: string; single?: boolean }) {
  return (
    <article className="cash-card flex h-full flex-col rounded-3xl border p-4">
      <p className={`cash-muted text-xs font-semibold uppercase ${single ? "whitespace-nowrap tracking-[0.04em]" : "tracking-[0.12em]"}`}>{title}</p>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
      <p className="cash-muted mt-2 text-sm">{detail}</p>
    </article>
  );
}

function Pill({ flow }: { flow: CashFlow }) {
  const tone = flow === "in" ? "bg-emerald-100 text-emerald-800" : flow === "out" ? "bg-rose-100 text-rose-800" : "bg-indigo-100 text-indigo-800";
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
