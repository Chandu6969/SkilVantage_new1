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

test("a teacher payment sheet carries the class record, the HR sign, and the stamp", () => {
  const text = new TextDecoder().decode(buildReportPdf({
    ...report,
    kicker: "TEACHER PAYMENT",
    title: "Skill Vantage - Teacher Details",
    subtitle: "Teacher information and class record • September 2026",
    tableHeading: "Teacher details",
    columns: ["Teacher name", "Phone", "Email", "Subject / course", "Joining date", "Status", "Month classes", "Total classes"],
    rows: [["lova Raj", "7661041185", "No Email", "SQL", "03 Sept 2026", "Active", "11", "11"]],
    sections: [{
      heading: "Teacher class record • September 2026",
      columns: ["Date", "Teacher name", "Course / subject", "Class / session", "Amount / class", "Status"],
      rows: [["03 Sept 2026", "lova Raj", "Data Base& SQL", "10:00 PM - 11:00 PM", "Rs 350", "Taken"]],
    }],
    signOff: { issued: "30 September 2026", period: "September 2026" },
    footer: "Skill Vantage • Teacher Management Record • Printed document",
  }));
  assert.match(text, /Teacher details/);
  assert.match(text, /lova Raj/);
  assert.match(text, /10:00 PM - 11:00 PM/);
  assert.match(text, /Taken/);
  assert.match(text, /\(HR\)/);
  assert.match(text, /SKILLVANTAGE/);
  assert.match(text, /TEACHER MANAGEMENT/);
  assert.match(text, /SkilVantage/);
  assert.match(text, /Official stamp/);
  assert.match(text, /DCTDecode/);
  assert.match(text, /Payment period: September 2026/);
  assert.match(text, /Date: 30 September 2026/);
});

test("a monthly register is a landscape page with each day", () => {
  const days = Array.from({ length: 30 }, (_, index) => String(index + 1));
  const text = new TextDecoder().decode(buildReportPdf({
    ...report,
    kicker: "MONTHLY ATTENDANCE REPORT",
    title: "All batches",
    subtitle: "November 2026",
    wide: true,
    columns: ["S.No", "Name", ...days],
    rows: [["1", "Gopireddy Avinash", "P", "A", "LJ", ...Array.from({ length: 27 }, () => "—")]],
    footer: "P = Present • A = Absent • LJ = Late join • WO = Week off • Skillvantage • Monthly Attendance Report",
  }));
  assert.match(text, /MediaBox \[0 0 842 595\]/);
  assert.match(text, /MONTHLY ATTENDANCE REPORT/);
  assert.match(text, /Gopireddy Avinash/);
  assert.match(text, /\(P\)/);
  assert.match(text, /\(LJ\)/);
  assert.match(text, /\(30\)/);
});

test("a report header keeps the summary on the right of a short bar", () => {
  const text = new TextDecoder().decode(buildReportPdf(report));
  assert.match(text, /DAILY ATTENDANCE REPORT/);
  assert.match(text, /SASI/);
  assert.match(text, /0 764 595 78 re f/);
});

test("a long report keeps every row across pages", () => {
  const rows = Array.from({ length: 40 }, (_, index) => [String(index + 1), `Learner ${index + 1}`, "Course", index % 2 ? "Absent" : "Present"]);
  const text = new TextDecoder().decode(buildReportPdf({ ...report, rows }));
  assert.match(text, /Learner 1/);
  assert.match(text, /Learner 40/);
  assert.match(text, /\/Count 2/);
});
