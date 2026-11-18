"use client";

import { buildReportPdf, type ReportDocument } from "@/lib/report-pdf";

export function ReportActions({ report, summary, fileName }: { report: ReportDocument; summary: string; fileName: string }) {
  function file() {
    const bytes = buildReportPdf(report);
    const copy = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(copy).set(bytes);
    return new File([copy], fileName, { type: "application/pdf" });
  }

  function download() {
    const blob = file();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = blob.name;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function share() {
    const pdf = file();
    if (typeof navigator.share === "function" && navigator.canShare?.({ files: [pdf] })) {
      try {
        await navigator.share({ files: [pdf], title: summary.split("\n")[0] || "Skillvantage", text: summary });
        return;
      } catch {
        return;
      }
    }
    download();
    window.open(`https://wa.me/?text=${encodeURIComponent(`${summary}\n\nThe PDF has downloaded. Attach ${fileName} in this chat.`)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="no-print flex flex-wrap gap-2">
      <button type="button" onClick={() => window.print()} className="h-10 rounded-xl bg-[#065f46] px-4 text-sm font-medium text-white">Print / Save PDF</button>
      <button type="button" onClick={download} className="h-10 rounded-xl border border-[#065f46] px-4 text-sm font-medium text-[#065f46]">Download PDF</button>
      <button type="button" onClick={() => void share()} className="h-10 rounded-xl bg-[#128C7E] px-4 text-sm font-medium text-white">Share on WhatsApp</button>
    </div>
  );
}
