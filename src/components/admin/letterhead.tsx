import Link from "next/link";
import { ReportActions } from "@/components/admin/report-actions";
import type { ReportDocument, ReportTone } from "@/lib/report-pdf";

const tones: Record<ReportTone, { band: string; soft: string; ink: string }> = {
  student: { band: "#065f46", soft: "#ecfdf5", ink: "#064e3b" },
  professional: { band: "#312e81", soft: "#eef2ff", ink: "#1e1b4b" },
  teacher: { band: "#9a3412", soft: "#fff7ed", ink: "#7c2d12" },
};

function statusClass(value: string) {
  const key = value.trim().toLowerCase();
  if (key.startsWith("present") || key === "paid" || key === "reviewed" || key === "taken" || key === "active") return "text-[#047857]";
  if (key.startsWith("absent")) return "text-[#be123c]";
  if (key.startsWith("late")) return "text-[#7e22ce]";
  if (key.startsWith("leave") || key === "pending" || key === "due") return "text-[#b45309]";
  if (key.startsWith("holiday") || key === "submitted") return "text-[#0369a1]";
  return "text-[#64748b]";
}

export function Letterhead({
  report,
  back,
  summary,
  fileName,
}: {
  report: ReportDocument;
  back: string;
  summary: string;
  fileName: string;
}) {
  const tone = tones[report.tone];
  const payment = Boolean(report.signOff);
  return (
    <div className="print-sheet print-letter mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white text-[#17211e] shadow-xl">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-5 py-3">
        <Link href={back} className="text-sm text-[#3d4a57] hover:underline">Back</Link>
        <ReportActions report={report} summary={summary} fileName={fileName} />
      </div>
      {payment && report.signOff ? (
        <header className="px-5 pt-5">
          <div className="relative overflow-hidden rounded-2xl bg-[#0f766e] px-5 py-5 text-center text-white sm:px-6">
            <div className="pointer-events-none absolute -right-8 -top-12 size-36 rounded-full bg-[#2dd4bf]/40" />
            <p className="relative text-right text-[0.68rem] text-white/90 sm:absolute sm:right-4 sm:top-3">Date: {report.signOff.issued}</p>
            <p className="relative mt-1 text-[0.68rem] tracking-[0.18em] sm:tracking-[0.28em]">SKILLVANTAGE • TEACHER MANAGEMENT</p>
            <h1 className="relative mt-2 text-2xl font-semibold">{report.title}</h1>
            <p className="relative mt-1 text-sm text-white/90">{report.subtitle}</p>
          </div>
        </header>
      ) : (
        <header className="px-6 py-6 text-white" style={{ background: tone.band }}>
          <p className="text-lg font-semibold tracking-[0.28em]">SKILLVANTAGE</p>
          <p className="mt-1 text-[0.68rem] tracking-[0.22em]">LEARN • PRACTICE • GROW</p>
          <h1 className="mt-4 text-2xl font-semibold">{report.kicker}</h1>
          <p className="mt-2 text-sm text-white/90">{report.title} • {report.subtitle}</p>
          <p className="mt-1 text-xs text-white/75">Generated {report.generated}</p>
        </header>
      )}
      <div className="grid gap-2 px-5 py-4" style={{ gridTemplateColumns: `repeat(${Math.max(report.stats.length, 1)}, minmax(0, 1fr))` }}>
        {report.stats.map((stat, index) => (
          <article key={stat.label} className={`rounded-xl border px-3 py-3 ${payment ? "border-[#d7efe4] bg-[#f7fbf9]" : ""}`} style={payment ? undefined : { background: tone.soft, color: tone.ink }}>
            {payment ? <p className="text-[0.64rem] tracking-[0.14em] text-[#5d8572] uppercase">{stat.label}</p> : null}
            <p className={`text-2xl font-semibold ${payment && index === report.stats.length - 1 ? "text-[#0f766e]" : ""}`}>{stat.value}</p>
            {payment ? null : <p className="text-[0.68rem] tracking-[0.12em] uppercase">{stat.label}</p>}
          </article>
        ))}
      </div>
      <ReportTable tone={tone} sheet={payment} heading={report.tableHeading} columns={report.columns} rows={report.rows} empty={report.tableHeading ? "Nothing recorded yet." : "Nothing to show for this batch."} />
      {(report.sections ?? []).map((section) => (
        <ReportTable key={section.heading} tone={tone} sheet={payment} heading={section.heading} columns={section.columns} rows={section.rows} foot={section.foot} empty="Nothing recorded yet." />
      ))}
      {report.signOff ? <PaymentSign period={report.signOff.period} issued={report.signOff.issued} /> : null}
      <footer className="border-t border-black/5 px-6 py-3 text-xs text-[#6b7480]">
        <p>{report.footer}</p>
      </footer>
    </div>
  );
}

function ReportTable({
  tone,
  sheet,
  heading,
  columns,
  rows,
  foot,
  empty,
}: {
  tone: { band: string; ink: string };
  sheet: boolean;
  heading?: string;
  columns: string[];
  rows: string[][];
  foot?: string;
  empty: string;
}) {
  return (
    <div className="px-5 pb-4">
      <div className={sheet ? "rounded-2xl border border-[#d7efe4] bg-[#f7fbf9] p-3" : ""}>
        {heading ? <h2 className="mb-2 text-sm font-semibold" style={{ color: tone.ink }}>{heading}</h2> : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="text-[0.68rem] tracking-wide text-white" style={{ background: sheet ? "#0f766e" : tone.band }}>
                {columns.map((column) => <th key={column} className="px-2 py-2 font-medium">{column}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row[0]}-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-[#f4fbf7]"}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${columnKey(columns, cellIndex)}-${index}`} className="px-2 py-2 align-middle">{cellIndex === row.length - 1 ? <StatusCell value={cell} /> : cell}</td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr><td className="px-2 py-6 text-[#64748b]" colSpan={columns.length}>{empty}</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {foot ? <p className="pt-2 text-right text-sm font-semibold" style={{ color: tone.ink }}>{foot}</p> : null}
      </div>
    </div>
  );
}

function StatusCell({ value }: { value: string }) {
  const key = value.trim().toLowerCase();
  if (key === "active" || key === "taken") {
    return <span className="inline-flex rounded-full bg-[#d1fae5] px-2 py-0.5 text-[0.68rem] font-semibold tracking-wide text-[#047857]">{value}</span>;
  }
  return <span className={`font-medium ${statusClass(value)}`}>{value}</span>;
}

function columnKey(columns: string[], index: number) {
  return columns[index] || String(index);
}

function PaymentSign({ issued, period }: { issued: string; period: string }) {
  return (
    <div className="grid items-end gap-6 px-6 py-6 sm:grid-cols-[1fr_auto_1fr]">
      <div>
        <img src="/brand/hr-signature.png" alt="HR signature, Shalem Raj" className="h-16 w-auto" />
        <p className="mt-1 text-sm font-semibold tracking-[0.16em]">HR</p>
        <p className="text-xs text-[#3d4a57]">SkilVantage</p>
      </div>
      <div className="text-center">
        <img src="/brand/skilvantage-stamp.png" alt="Skillvantage official paid stamp" className="mx-auto h-28 w-auto" />
        <p className="text-xs text-[#3d4a57]">Official stamp</p>
      </div>
      <div className="text-sm text-[#17211e] sm:text-right">
        <p className="text-[#5d8572]">Issued:</p>
        <p className="text-base font-semibold">{issued}</p>
        <p className="mt-2">Payment period: {period}</p>
      </div>
    </div>
  );
}
