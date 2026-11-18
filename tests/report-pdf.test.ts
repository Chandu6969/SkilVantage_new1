import assert from "node:assert/strict";
import test from "node:test";
import { buildReportPdf, type ReportDocument } from "../src/lib/report-pdf";

const report: ReportDocument = {
  tone: "student",
  kicker: "DAILY ATTENDANCE REPORT",
  title: "SASI",
  subtitle: "7 November 2026 • Sat • Students",
  generated: "07 Nov 2026, 11:27 pm",
  stats: [
    { label: "Present", value: "11" },
    { label: "Absent", value: "18" },
    { label: "Leave", value: "0" },
    { label: "Holiday", value: "0" },
    { label: "Attendance", value: "38%" },
  ],
  columns: ["S.No", "Student Name", "Year / Course", "Status"],
  rows: [["1", "Gopireddy Avinash", "4th Year B.Tech • AI/ML", "Present"]],
  footer: "P = Present • A = Absent • L = Leave • H = Holiday • Skillvantage",
};

test("a report pdf starts as a pdf document", () => {
  const bytes = buildReportPdf(report);
  const text = new TextDecoder().decode(bytes);
  assert.equal(text.slice(0, 5), "%PDF-");
  assert.match(text, /SKILLVANTAGE/);
  assert.match(text, /LEARN/);
  assert.match(text, /DAILY ATTENDANCE REPORT/);
  assert.match(text, /SASI/);
  assert.match(text, /Gopireddy Avinash/);
  assert.match(text, /38%/);
});

test("a learner report keeps the monthly payments and the assignment", () => {
  const text = new TextDecoder().decode(buildReportPdf({
    ...report,
    kicker: "STUDENT REPORT",
    title: "Gopireddy Avinash",
    tableHeading: "Payments by month",
    columns: ["S.No", "Month", "Collected"],
    rows: [["1", "Nov 2026", "Rs 5,000"]],
    sections: [{ heading: "Assignments", columns: ["S.No", "Work", "Due", "Status"], rows: [["1", "Excel dashboard", "23 Nov 2026", "Pending"]] }],
  }));
  assert.match(text, /Payments by month/);
  assert.match(text, /Nov 2026/);
  assert.match(text, /Excel dashboard/);
  assert.match(text, /Pending/);
});

test("a long report keeps every row across pages", () => {
  const rows = Array.from({ length: 40 }, (_, index) => [String(index + 1), `Learner ${index + 1}`, "Course", index % 2 ? "Absent" : "Present"]);
  const text = new TextDecoder().decode(buildReportPdf({ ...report, rows }));
  assert.match(text, /Learner 1/);
  assert.match(text, /Learner 40/);
  assert.match(text, /\/Count 2/);
});
