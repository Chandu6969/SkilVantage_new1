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
  if (key.startsWith("present") || key === "paid" || key === "reviewed") return "text-[#047857]";
  if (key.startsWith("absent")) return "text-[#be123c]";
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
  return (
    <div className="print-sheet print-letter mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white text-[#17211e] shadow-xl">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-5 py-3">
        <Link href={back} className="text-sm text-[#3d4a57] hover:underline">Back</Link>
        <ReportActions report={report} summary={summary} fileName={fileName} />
      </div>
      <header className="px-6 py-6 text-white" style={{ background: tone.band }}>
        <p className="text-lg font-semibold tracking-[0.28em]">SKILLVANTAGE</p>
        <p className="mt-1 text-[0.68rem] tracking-[0.22em]">LEARN • PRACTICE • GROW</p>
        <h1 className="mt-4 text-2xl font-semibold">{report.kicker}</h1>
        <p className="mt-2 text-sm text-white/90">{report.title} • {report.subtitle}</p>
        <p className="mt-1 text-xs text-white/75">Generated {report.generated}</p>
      </header>
      <div className="grid gap-2 px-6 py-4" style={{ gridTemplateColumns: `repeat(${Math.max(report.stats.length, 1)}, minmax(0, 1fr))` }}>
        {report.stats.map((stat) => (
          <article key={stat.label} className="rounded-xl px-3 py-3" style={{ background: tone.soft, color: tone.ink }}>
            <p className="text-2xl font-semibold">{stat.value}</p>
            <p className="text-[0.68rem] tracking-[0.12em] uppercase">{stat.label}</p>
          </article>
        ))}
      </div>
      <div className="px-6 pb-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs tracking-wide text-white uppercase" style={{ background: tone.band }}>
              {report.columns.map((column) => <th key={column} className="px-2 py-2 font-medium">{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {report.rows.map((row, index) => (
              <tr key={`${row[0]}-${index}`} className={index % 2 === 0 ? "bg-[#f8fbfb]" : "bg-white"}>
                {row.map((cell, cellIndex) => (
                  <td key={`${columnKey(report.columns, cellIndex)}-${index}`} className={`px-2 py-2 ${cellIndex === row.length - 1 ? `font-medium ${statusClass(cell)}` : ""}`}>{cell}</td>
                ))}
              </tr>
            ))}
            {report.rows.length === 0 ? (
              <tr><td className="px-2 py-6 text-[#64748b]" colSpan={report.columns.length}>Nothing to show for this batch.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <footer className="border-t border-black/5 px-6 py-3 text-xs text-[#6b7480]">
        <p>{report.footer}</p>
      </footer>
    </div>
  );
}

function columnKey(columns: string[], index: number) {
  return columns[index] || String(index);
}
