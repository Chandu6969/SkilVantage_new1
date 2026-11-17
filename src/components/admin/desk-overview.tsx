"use client";

import { useMemo, useState } from "react";
import type { LearnerType } from "@/lib/types";

export type OverviewFee = {
  at: string;
  name: string;
  amount: number;
  kind: "cash" | "bank" | "upi";
  who: LearnerType;
  batch: string;
};

export type OverviewLead = {
  at: string;
  name: string;
  learnerType: LearnerType;
  program: string;
  status: string;
};

export type OverviewProgram = {
  slug: string;
  name: string;
  count: number;
  from: string;
  to: string;
};

export type OverviewPay = {
  at: string;
  name: string;
  amount: number;
  status: "due" | "paid";
  course: string;
};

export type OverviewData = {
  students: number;
  professionals: number;
  siteStudents: number;
  siteProfessionals: number;
  presentToday: number;
  absentToday: number;
  openAssignments: number;
  programs: OverviewProgram[];
  leads: OverviewLead[];
  fees: OverviewFee[];
  teacherPays: OverviewPay[];
};

function rupees(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function dayKey(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Calcutta" });
}

function startOfDay(key: string) {
  return new Date(`${key}T00:00:00+05:30`).getTime();
}

export function DeskOverview({ data }: { data: OverviewData }) {
  const [range, setRange] = useState<"week" | "month" | "year">("month");
  const buckets = useMemo(() => buildBuckets(range, data), [range, data]);
  const collected = data.fees.reduce((sum, fee) => sum + fee.amount, 0);
  const cash = data.fees.filter((fee) => fee.kind === "cash").reduce((sum, fee) => sum + fee.amount, 0);
  const bank = data.fees.filter((fee) => fee.kind === "bank").reduce((sum, fee) => sum + fee.amount, 0);
  const upi = data.fees.filter((fee) => fee.kind === "upi").reduce((sum, fee) => sum + fee.amount, 0);
  const teacherDue = data.teacherPays.filter((pay) => pay.status === "due").reduce((sum, pay) => sum + pay.amount, 0);
  const teacherPaid = data.teacherPays.filter((pay) => pay.status === "paid").reduce((sum, pay) => sum + pay.amount, 0);
  const rangeFees = buckets.reduce((sum, bucket) => sum + bucket.fees, 0);
  const rangeLeads = buckets.reduce((sum, bucket) => sum + bucket.leads, 0);
  const programTotal = data.programs.reduce((sum, item) => sum + item.count, 0);
  const activity = recentActivity(data);

  return (
    <section className="rounded-[28px] p-3 sm:p-5" style={{ background: "#f4f1fb", color: "#14211c" }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <p className="text-sm text-[#6b728d]">Payments, registrations, and who is in class.</p>
        </div>
        <div className="flex rounded-full bg-white p-1 text-xs shadow-sm">
          {(["week", "month", "year"] as const).map((item) => (
            <button key={item} type="button" onClick={() => setRange(item)} className={`rounded-full px-3 py-1.5 capitalize ${range === item ? "bg-[#5b4dff] text-white" : "text-[#6b728d]"}`}>
              {item === "week" ? "Weekly" : item === "month" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_0.8fr]">
        <article className="rounded-3xl bg-white p-4 shadow-sm sm:p-5">
          <p className="text-3xl font-semibold tracking-tight sm:text-4xl">{rupees(rangeFees || collected)}</p>
          <p className="mt-1 text-sm text-[#6b728d]">{rangeLeads} registrations in this {range}</p>
          <FeeChart buckets={buckets} />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat color="#10b981" label="Cash" value={rupees(cash)} />
            <MiniStat color="#3b82f6" label="Bank" value={rupees(bank)} />
            <MiniStat color="#f97316" label="UPI" value={rupees(upi)} />
            <MiniStat color="#f43f5e" label="Teacher due" value={rupees(teacherDue)} />
          </div>
        </article>
        <article className="rounded-3xl bg-white p-4 shadow-sm sm:p-5">
          <h3 className="text-lg font-semibold" style={{ color: "#14211c" }}>Registrations</h3>
          <p className="text-sm" style={{ color: "#3d4a57" }}>Every course keeps its own colour. The number is the real count.</p>
          <Donut programs={data.programs} total={programTotal} />
          <ul className="mt-3 grid gap-2">
            {data.programs.map((item) => (
              <li key={item.slug} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-white" style={{ background: `linear-gradient(90deg, ${item.from}, ${item.to})` }}>
                <span>{item.name}</span>
                <span>{item.count}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GradientCard from="#065f46" to="#10b981" title="Students" value={String(data.students)} detail={`${data.siteStudents} registered on the website`} bars={buckets.map((bucket) => bucket.studentLeads)} />
        <GradientCard from="#312e81" to="#818cf8" title="Professionals" value={String(data.professionals)} detail={`${data.siteProfessionals} registered on the website`} bars={buckets.map((bucket) => bucket.proLeads)} />
        <GradientCard from="#1e3a8a" to="#60a5fa" title="Fees collected" value={rupees(collected)} detail={`${data.fees.length} payments recorded`} bars={buckets.map((bucket) => bucket.fees)} />
        <GradientCard from="#9a3412" to="#fb923c" title="Teacher pay" value={rupees(teacherDue)} detail={`${rupees(teacherPaid)} already paid · ${data.presentToday} present today`} bars={buckets.map((bucket) => bucket.teacherDue)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <article className="rounded-3xl bg-white p-4 shadow-sm sm:p-5">
          <h3 className="font-semibold">Recent activity</h3>
          <ul className="mt-3 grid gap-3">
            {activity.length === 0 ? <li className="text-sm text-[#6b728d]">Registrations, fees, and class payments will show up here.</li> : null}
            {activity.map((item) => (
              <li key={item.id} className="flex gap-3 text-sm">
                <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
                <span>
                  <span className="block font-medium">{item.title}</span>
                  <span className="text-[#6b728d]">{item.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[#6b728d]">Open assignments {data.openAssignments} · absent today {data.absentToday}</p>
        </article>
        <article className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 sm:px-5">
            <div>
              <h3 className="font-semibold">Payments</h3>
              <p className="text-sm text-[#6b728d]">Student fees and teacher class pay</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[#1f2433] text-xs tracking-wide text-white uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">From</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentRows(data).map((row) => (
                  <tr key={row.id} className="border-t border-black/5">
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-[#6b728d]">{row.from}</td>
                    <td className="px-4 py-3">{rupees(row.amount)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2.5 py-1 text-xs font-medium text-white" style={{ background: row.color }}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paymentRows(data).length === 0 ? <p className="px-5 py-8 text-sm text-[#6b728d]">No payments yet. Cash, bank, and UPI from learners, and class pay for teachers, land in this table.</p> : null}
          </div>
        </article>
      </div>
    </section>
  );
}

function MiniStat({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-medium" style={{ color: "#3d4a57" }}><span className="size-2.5 rounded-full" style={{ background: color }} />{label}</p>
      <p className="mt-1 text-base font-semibold" style={{ color: "#14211c" }}>{value}</p>
    </div>
  );
}

function GradientCard({ from, to, title, value, detail, bars }: { from: string; to: string; title: string; value: string; detail: string; bars: number[] }) {
  const max = Math.max(1, ...bars);
  return (
    <article className="rounded-3xl p-4 text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/80">{title}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <svg viewBox="0 0 72 36" className="h-9 w-16" aria-hidden="true">
          {bars.map((bar, index) => (
            <rect key={index} x={index * 12} y={36 - (bar / max) * 32} width="8" height={(bar / max) * 32} rx="2" fill="white" opacity={0.35 + (index / Math.max(1, bars.length)) * 0.55} />
          ))}
        </svg>
      </div>
      <p className="mt-3 text-xs text-white/85">{detail}</p>
    </article>
  );
}

function FeeChart({ buckets }: { buckets: Bucket[] }) {
  const width = 640;
  const height = 210;
  const max = Math.max(1, ...buckets.map((bucket) => Math.max(bucket.fees, bucket.leads)));
  const point = (value: number, index: number) => {
    const x = buckets.length === 1 ? width / 2 : (index / (buckets.length - 1)) * (width - 36) + 18;
    const y = height - 28 - (value / max) * (height - 56);
    return [x, y] as const;
  };
  const fees = smooth(buckets.map((bucket, index) => point(bucket.fees, index)));
  const leads = smooth(buckets.map((bucket, index) => point(bucket.leads, index)));
  const first = point(buckets[0]?.fees || 0, 0);
  const last = point(buckets.at(-1)?.fees || 0, Math.max(0, buckets.length - 1));
  return (
    <div className="mt-2 overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-52 min-w-[520px] w-full" role="img" aria-label="Fees collected and registrations across the selected period">
        <defs>
          <linearGradient id="sv-fee-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => (
          <line key={line} x1="12" x2={width - 12} y1={36 + line * 40} y2={36 + line * 40} stroke="#eceaf3" />
        ))}
        <path d={`${fees} L ${last[0]} ${height - 28} L ${first[0]} ${height - 28} Z`} fill="url(#sv-fee-fill)" />
        <path d={fees} fill="none" stroke="#d946ef" strokeWidth="3" strokeLinecap="round" />
        <path d={leads} fill="none" stroke="#fb923c" strokeWidth="3" strokeLinecap="round" />
        {buckets.map((bucket, index) => {
          const [x] = point(0, index);
          return <text key={bucket.label + index} x={x} y={height - 8} textAnchor="middle" fontSize="11" fill="#8b8fa3">{bucket.label}</text>;
        })}
      </svg>
      <p className="flex gap-4 text-xs text-[#6b728d]">
        <span className="flex items-center gap-1"><i className="inline-block h-0.5 w-4 bg-[#d946ef]" /> Fees</span>
        <span className="flex items-center gap-1"><i className="inline-block h-0.5 w-4 bg-[#fb923c]" /> Registrations</span>
      </p>
    </div>
  );
}

function Donut({ programs, total }: { programs: OverviewProgram[]; total: number }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const weights = programs.map((item) => item.count + 0.45);
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  let offset = 0;
  return (
    <div className="mx-auto mt-3 grid size-40 place-items-center">
      <svg viewBox="0 0 160 160" className="col-start-1 row-start-1 size-40" role="img" aria-label={total ? `${total} course registrations` : "No course registrations yet"}>
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#eeeaf8" strokeWidth="18" />
        {programs.map((item, index) => {
          const length = Math.max(8, (weights[index]! / weightTotal) * circumference - 4);
          const circle = (
            <circle
              key={item.slug}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={item.from}
              strokeWidth="18"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 80 80)"
            />
          );
          offset += length + 4;
          return circle;
        })}
      </svg>
      <div className="col-start-1 row-start-1 text-center">
        <p className="text-2xl font-semibold" style={{ color: "#14211c" }}>{total}</p>
        <p className="text-xs" style={{ color: "#3d4a57" }}>Registered</p>
      </div>
    </div>
  );
}

type Bucket = { label: string; start: number; end: number; fees: number; leads: number; studentLeads: number; proLeads: number; teacherDue: number };

function buildBuckets(range: "week" | "month" | "year", data: OverviewData): Bucket[] {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" }));
  const buckets: Bucket[] = [];
  if (range === "week") {
    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(now);
      date.setDate(date.getDate() - index);
      const key = date.toLocaleDateString("en-CA", { timeZone: "Asia/Calcutta" });
      buckets.push({ label: date.toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Calcutta" }), start: startOfDay(key), end: startOfDay(key) + 86400000, fees: 0, leads: 0, studentLeads: 0, proLeads: 0, teacherDue: 0 });
    }
  } else if (range === "month") {
    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      buckets.push({ label: date.toLocaleDateString("en-IN", { month: "short" }), start: date.getTime(), end: next.getTime(), fees: 0, leads: 0, studentLeads: 0, proLeads: 0, teacherDue: 0 });
    }
  } else {
    for (let index = 3; index >= 0; index -= 1) {
      const year = now.getFullYear() - index;
      buckets.push({ label: String(year), start: new Date(year, 0, 1).getTime(), end: new Date(year + 1, 0, 1).getTime(), fees: 0, leads: 0, studentLeads: 0, proLeads: 0, teacherDue: 0 });
    }
  }
  const stamp = (value: string) => startOfDay(dayKey(value) || "1970-01-01");
  for (const fee of data.fees) {
    const at = stamp(fee.at);
    const bucket = buckets.find((item) => at >= item.start && at < item.end);
    if (bucket) bucket.fees += fee.amount;
  }
  for (const lead of data.leads) {
    const at = stamp(lead.at);
    const bucket = buckets.find((item) => at >= item.start && at < item.end);
    if (!bucket) continue;
    bucket.leads += 1;
    if (lead.learnerType === "student") bucket.studentLeads += 1;
    else bucket.proLeads += 1;
  }
  for (const pay of data.teacherPays) {
    if (pay.status !== "due") continue;
    const at = stamp(pay.at);
    const bucket = buckets.find((item) => at >= item.start && at < item.end);
    if (bucket) bucket.teacherDue += pay.amount;
  }
  return buckets;
}

function smooth(points: (readonly [number, number])[]) {
  if (points.length === 0) return "";
  let path = `M ${points[0]![0]} ${points[0]![1]}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const [x1, y1] = points[index]!;
    const [x2, y2] = points[index + 1]!;
    const mid = (x1 + x2) / 2;
    path += ` C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
  }
  return path;
}

function recentActivity(data: OverviewData) {
  const rows = [
    ...data.leads.map((lead) => ({
      id: `lead-${lead.at}-${lead.name}`,
      at: lead.at,
      title: lead.name,
      detail: `${lead.learnerType === "student" ? "Student" : "Professional"} · ${lead.program} · ${lead.status}`,
      color: lead.learnerType === "student" ? "#10b981" : "#6366f1",
    })),
    ...data.fees.map((fee) => ({
      id: `fee-${fee.at}-${fee.name}-${fee.amount}`,
      at: fee.at,
      title: `${fee.name} paid ${rupees(fee.amount)}`,
      detail: `${fee.kind.toUpperCase()} · ${fee.batch}`,
      color: fee.kind === "cash" ? "#10b981" : fee.kind === "bank" ? "#3b82f6" : "#f97316",
    })),
    ...data.teacherPays.map((pay) => ({
      id: `pay-${pay.at}-${pay.name}`,
      at: pay.at,
      title: `${pay.name} class pay ${rupees(pay.amount)}`,
      detail: `${pay.course} · ${pay.status === "paid" ? "Paid" : "Due"}`,
      color: pay.status === "paid" ? "#10b981" : "#f97316",
    })),
  ];
  return rows.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
}

function paymentRows(data: OverviewData) {
  const fees = data.fees.map((fee) => ({
    id: `fee-${fee.at}-${fee.name}-${fee.amount}`,
    at: fee.at,
    name: fee.name,
    from: `${fee.who === "student" ? "Student" : "Professional"} · ${fee.batch}`,
    amount: fee.amount,
    status: fee.kind === "cash" ? "Cash" : fee.kind === "bank" ? "Bank" : "UPI",
    color: fee.kind === "cash" ? "#10b981" : fee.kind === "bank" ? "#3b82f6" : "#f97316",
  }));
  const pays = data.teacherPays.map((pay) => ({
    id: `pay-${pay.at}-${pay.name}-${pay.amount}`,
    at: pay.at,
    name: pay.name,
    from: `Teacher · ${pay.course}`,
    amount: pay.amount,
    status: pay.status === "paid" ? "Paid" : "Due",
    color: pay.status === "paid" ? "#8b5cf6" : "#f43f5e",
  }));
  return [...fees, ...pays].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
}
