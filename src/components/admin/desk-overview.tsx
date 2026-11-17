"use client";

import type { CSSProperties } from "react";
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

export function DeskOverview({ data }: { data: OverviewData }) {
  const collected = data.fees.reduce((sum, fee) => sum + fee.amount, 0);
  const cash = data.fees.filter((fee) => fee.kind === "cash").reduce((sum, fee) => sum + fee.amount, 0);
  const bank = data.fees.filter((fee) => fee.kind === "bank").reduce((sum, fee) => sum + fee.amount, 0);
  const upi = data.fees.filter((fee) => fee.kind === "upi").reduce((sum, fee) => sum + fee.amount, 0);
  const teacherDue = data.teacherPays.filter((pay) => pay.status === "due").reduce((sum, pay) => sum + pay.amount, 0);
  const teacherPaid = data.teacherPays.filter((pay) => pay.status === "paid").reduce((sum, pay) => sum + pay.amount, 0);
  const programTotal = data.programs.reduce((sum, item) => sum + item.count, 0);
  const activity = recentActivity(data);
  const moneySlices = [
    { label: "Cash", value: cash, color: "#10b981" },
    { label: "Bank", value: bank, color: "#3b82f6" },
    { label: "UPI", value: upi, color: "#f97316" },
    { label: "Teacher paid", value: teacherPaid, color: "#8b5cf6" },
    { label: "Still to pay", value: teacherDue, color: "#f43f5e" },
  ];
  return (
    <section
      className="rounded-[28px] p-3 sm:p-5"
      style={{
        color: "#14211c",
        background:
          "radial-gradient(720px 280px at 0% -10%, rgb(52 211 153 / 0.34), transparent 58%), radial-gradient(560px 260px at 100% 0%, rgb(16 185 129 / 0.2), transparent 54%), #f4fbf6",
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GradientCard from="#065f46" to="#10b981" title="Students" value={String(data.students)} detail={`${data.siteStudents} registered on the website`} />
        <GradientCard from="#312e81" to="#818cf8" title="Professionals" value={String(data.professionals)} detail={`${data.siteProfessionals} registered on the website`} />
        <GradientCard from="#1e3a8a" to="#60a5fa" title="Fees collected" value={rupees(collected)} detail={`${data.fees.length} payments recorded`} />
        <GradientCard from="#9a3412" to="#fb923c" title="Teacher pay" value={rupees(teacherDue)} detail={`${rupees(teacherPaid)} already paid · ${data.presentToday} present today`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl p-4 sm:p-5" style={glass}>
          <h2 className="text-lg font-semibold">Payments</h2>
          <p className="text-sm" style={{ color: "#3d4a57" }}>Cash, bank, UPI, and what is still owed to teachers.</p>
          <div className="mt-4 grid items-center gap-4 sm:grid-cols-[180px_1fr]">
            <Donut slices={moneySlices} center={rupees(collected + teacherPaid + teacherDue)} caption="All money" />
            <SliceList slices={moneySlices} format={(value) => rupees(value)} />
          </div>
        </article>
        <article className="rounded-3xl p-4 sm:p-5" style={glass}>
          <h2 className="text-lg font-semibold">Courses</h2>
          <p className="text-sm" style={{ color: "#3d4a57" }}>A pie of who registered, in each course colour.</p>
          <div className="mt-4 grid items-center gap-4 sm:grid-cols-[180px_1fr]">
            <Pie slices={data.programs.map((item) => ({ label: item.name, value: item.count, color: item.to }))} />
            <SliceList slices={data.programs.map((item) => ({ label: item.name, value: item.count, color: item.from }))} format={(value) => String(value)} />
          </div>
          <p className="mt-3 text-xs" style={{ color: "#3d4a57" }}>{programTotal} registered on the website</p>
        </article>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <article className="rounded-3xl p-4 sm:p-5" style={glass}>
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
        <article className="overflow-hidden rounded-3xl" style={glass}>
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

const glass: CSSProperties = {
  background: "rgb(255 255 255 / 0.62)",
  border: "1px solid rgb(255 255 255 / 0.82)",
  boxShadow: "0 18px 40px rgb(16 80 40 / 0.08)",
  backdropFilter: "blur(18px)",
};

function GradientCard({ from, to, title, value, detail }: { from: string; to: string; title: string; value: string; detail: string }) {
  return (
    <article
      className="relative overflow-hidden rounded-3xl p-4"
      style={{
        color: from,
        background: `linear-gradient(165deg, color-mix(in srgb, ${to} 46%, white), color-mix(in srgb, ${from} 22%, white))`,
        border: "1px solid rgb(255 255 255 / 0.84)",
        boxShadow: "0 18px 42px rgb(16 80 40 / 0.1)",
        backdropFilter: "blur(18px)",
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-8 size-32 rounded-full"
        style={{ background: `radial-gradient(circle, color-mix(in srgb, ${to} 70%, white), transparent 68%)` }}
      />
      <div className="relative">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
        <p className="mt-3 text-sm leading-5">{detail}</p>
      </div>
    </article>
  );
}

type Slice = { label: string; value: number; color: string };

function SliceList({ slices, format }: { slices: Slice[]; format: (value: number) => string }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  return (
    <ul className="grid gap-2">
      {slices.map((slice) => {
        const share = total ? Math.round((slice.value / total) * 100) : 0;
        return (
          <li key={slice.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 font-medium" style={{ color: "#14211c" }}>
              <span className="size-3 rounded-full" style={{ background: slice.color }} />
              {slice.label}
            </span>
            <span style={{ color: "#3d4a57" }}>{format(slice.value)} · {share}%</span>
          </li>
        );
      })}
    </ul>
  );
}

function Donut({ slices, center, caption }: { slices: Slice[]; center: string; caption: string }) {
  const drawn = ringSlices(slices);
  return (
    <div className="mx-auto grid size-44 place-items-center">
      <svg viewBox="0 0 160 160" className="col-start-1 row-start-1 size-44" role="img" aria-label={caption}>
        <circle cx="80" cy="80" r="58" fill="none" stroke="#e7f6ee" strokeWidth="22" />
        {drawn.map((slice) => (
          <circle
            key={slice.label}
            cx="80"
            cy="80"
            r="58"
            fill="none"
            stroke={slice.color}
            strokeWidth="22"
            strokeDasharray={`${slice.length} ${slice.rest}`}
            strokeDashoffset={-slice.offset}
            transform="rotate(-90 80 80)"
          />
        ))}
      </svg>
      <div className="col-start-1 row-start-1 px-6 text-center">
        <p className="text-sm font-semibold leading-5" style={{ color: "#14211c" }}>{center}</p>
        <p className="text-[0.65rem]" style={{ color: "#3d4a57" }}>{caption}</p>
      </div>
    </div>
  );
}

function Pie({ slices }: { slices: Slice[] }) {
  const drawn = wedgeSlices(slices);
  return (
    <div className="mx-auto grid size-44 place-items-center">
      <svg viewBox="0 0 160 160" className="col-start-1 row-start-1 size-44" role="img" aria-label="Course registrations">
        <circle cx="80" cy="80" r="68" fill="#e7f6ee" />
        {drawn.map((slice) => (
          <path key={slice.label} d={slice.d} fill={slice.color} />
        ))}
        <circle cx="80" cy="80" r="28" fill="rgb(255 255 255 / 0.88)" />
      </svg>
    </div>
  );
}

function ringSlices(slices: Slice[]) {
  const active = slices.filter((slice) => slice.value > 0);
  const total = active.reduce((sum, slice) => sum + slice.value, 0);
  const circumference = 2 * Math.PI * 58;
  let offset = 0;
  return active.map((slice) => {
    const length = Math.max(6, (slice.value / total) * circumference - 3);
    const item = { ...slice, length, rest: circumference - length, offset };
    offset += length + 3;
    return item;
  });
}

function wedgeSlices(slices: Slice[]) {
  const active = slices.filter((slice) => slice.value > 0);
  const total = active.reduce((sum, slice) => sum + slice.value, 0);
  if (!total) return [];
  let angle = -Math.PI / 2;
  return active.map((slice) => {
    const sweep = (slice.value / total) * Math.PI * 2;
    const start = angle;
    angle += sweep;
    const radius = 68;
    const x1 = 80 + radius * Math.cos(start);
    const y1 = 80 + radius * Math.sin(start);
    const x2 = 80 + radius * Math.cos(angle - 0.02);
    const y2 = 80 + radius * Math.sin(angle - 0.02);
    const large = sweep > Math.PI ? 1 : 0;
    const d = sweep > Math.PI * 1.999
      ? `M 80 ${80 - radius} A ${radius} ${radius} 0 1 1 79.99 ${80 - radius} Z`
      : `M 80 80 L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
    return { ...slice, d };
  });
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
