import Link from "next/link";
import { Letterhead } from "@/components/admin/letterhead";
import { displayPhone } from "@/lib/batches";
import { classPay } from "@/lib/faculty";
import { programName } from "@/lib/palette";
import type { ReportDocument, ReportTone } from "@/lib/report-pdf";
import { settleCash } from "@/lib/cash-book";
import { getStore } from "@/lib/store";
import type { ClassDayStatus, FeePayment, LearnerType, TrainingBatch } from "@/lib/types";

export const dynamic = "force-dynamic";

function rupees(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function dayStamp(iso: string) {
  const [year, month, date] = iso.split("-").map(Number);
  if (!year || !month || !date) return iso;
  const value = new Date(Date.UTC(year, month - 1, date));
  const long = value.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const weekday = value.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  return `${long} • ${weekday}`;
}

function generatedStamp() {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

function safeFile(value: string) {
  return value.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "batch";
}

function toneOf(learnerType: LearnerType): ReportTone {
  return learnerType === "professional" ? "professional" : "student";
}

function statusLabel(status: ClassDayStatus | undefined) {
  if (status === "present") return "Present";
  if (status === "absent") return "Absent";
  if (status === "leave") return "Leave";
  if (status === "late") return "Late join";
  if (status === "holiday") return "Holiday";
  return "Not marked";
}

function monthName(key: string) {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "UTC" });
}

function titleCase(value: string) {
  return value ? value[0]!.toUpperCase() + value.slice(1) : value;
}

function monthsPaid(fees: FeePayment[]) {
  const totals = new Map<string, number>();
  for (const fee of fees) {
    const key = fee.paidOn.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(key)) continue;
    totals.set(key, (totals.get(key) || 0) + fee.amount);
  }
  return [...totals.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export default async function PrintPage({ searchParams }: { searchParams: Promise<{ section?: string; batch?: string; date?: string; id?: string; month?: string; audience?: string }> }) {
  const params = await searchParams;
  const section = params.section === "assignments" || params.section === "teachers" || params.section === "person" || params.section === "cash" ? params.section : "attendance";
  const store = getStore();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Calcutta" });
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date || "") ? params.date! : today;
  const generated = generatedStamp();

  if (section === "person") {
    const batches = await store.listBatches();
    const members = (await Promise.all(batches.map((batch) => store.listMembers(batch.id)))).flat();
    const member = members.find((item) => item.id === params.id);
    const batch = member ? batches.find((item) => item.id === member.batchId) : undefined;
    if (!member || !batch) {
      return (
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-semibold">Learner not found</h1>
          <Link href="/admin/students" className="mt-3 inline-block text-sm underline">Back to students</Link>
        </div>
      );
    }
    await store.syncAssignments(batch.id);
    const marks = (await store.listAttendance(batch.id)).filter((item) => item.memberId === member.id).sort((a, b) => b.date.localeCompare(a.date));
    const fees = (await store.listFees()).filter((item) => item.memberId === member.id);
    const assignments = (await store.listAssignments()).filter((item) => item.memberId === member.id).sort((a, b) => b.dueOn.localeCompare(a.dueOn));
    const present = marks.filter((mark) => mark.status === "present").length;
    const absent = marks.filter((mark) => mark.status === "absent").length;
    const leave = marks.filter((mark) => mark.status === "leave").length;
    const rated = present + absent + leave;
    const collected = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const pending = assignments.filter((item) => item.status === "pending").length;
    const tone = toneOf(batch.learnerType);
    const noun = batch.learnerType === "professional" ? "Professional" : "Student";
    const months = monthsPaid(fees);
    const report: ReportDocument = {
      tone,
      kicker: `${noun.toUpperCase()} REPORT`,
      title: member.fullName,
      subtitle: `${batch.name} • ${member.note || displayPhone(member.phone) || noun}`,
      generated,
      stats: [
        { label: "Attendance", value: rated ? `${Math.round((present / rated) * 100)}%` : "0%" },
        { label: "Present", value: String(present) },
        { label: "Absent", value: String(absent) },
        { label: "Collected", value: rupees(collected) },
        { label: "Pending", value: String(pending) },
      ],
      tableHeading: "Payments by month",
      columns: ["S.No", "Month", "Collected"],
      rows: months.map(([key, amount], index) => [String(index + 1), monthName(key), rupees(amount)]),
      sections: [
        {
          heading: "Attendance",
          columns: ["S.No", "Date", "Status"],
          rows: marks.map((mark, index) => [String(index + 1), dayStamp(mark.date), statusLabel(mark.status)]),
        },
        {
          heading: "Assignments",
          columns: ["S.No", "Work", "Due", "Status"],
          rows: assignments.map((item, index) => [String(index + 1), item.title, dayStamp(item.dueOn), titleCase(item.status)]),
        },
      ],
      footer: `Skillvantage • ${noun} report • ${member.fullName} • ${batch.name}`,
    };
    return (
      <Letterhead
        report={report}
        back={`/admin/people/${member.id}`}
        summary={`Skillvantage ${member.fullName}\n${batch.name}\nAttendance ${report.stats[0]?.value}\nCollected ${rupees(collected)}\nPending assignments ${pending}`}
        fileName={`Skillvantage-${safeFile(member.fullName)}.pdf`}
      />
    );
  }

  if (section === "teachers") {
    const [teachers, listed] = await Promise.all([store.listFaculty(), store.listFacultyPays()]);
    const pays = listed.filter((pay) => pay.kind !== "deducted");
    const due = pays.filter((pay) => pay.status === "due").reduce((sum, pay) => sum + pay.amount, 0);
    const paid = pays.filter((pay) => pay.status === "paid").reduce((sum, pay) => sum + pay.amount, 0);
    const report: ReportDocument = {
      tone: "teacher",
      kicker: "TEACHER PAY REPORT",
      title: "Teachers",
      subtitle: dayStamp(today),
      generated,
      stats: [
        { label: "Teachers", value: String(teachers.length) },
        { label: "Unpaid", value: rupees(due) },
        { label: "Paid", value: rupees(paid) },
        { label: "Classes", value: String(pays.length) },
      ],
      columns: ["S.No", "Teacher", "Course", "Unpaid", "Paid"],
      rows: teachers.map((teacher, index) => {
        const owed = pays.filter((pay) => pay.teacherId === teacher.id && pay.status === "due").reduce((sum, pay) => sum + pay.amount, 0);
        const settled = pays.filter((pay) => pay.teacherId === teacher.id && pay.status === "paid").reduce((sum, pay) => sum + pay.amount, 0);
        return [String(index + 1), teacher.fullName, `${programName(teacher.course)} • ${rupees(classPay(teacher.rate))}`, rupees(owed), rupees(settled)];
      }),
      footer: "Skillvantage • Teacher pay report • Unpaid is still due for class",
    };
    return (
      <Letterhead
        report={report}
        back="/admin/teacher"
        summary={`Skillvantage teachers\nUnpaid ${rupees(due)}\nPaid ${rupees(paid)}`}
        fileName="Skillvantage-teachers.pdf"
      />
    );
  }

  if (section === "cash") {
    const month = /^\d{4}-\d{2}$/.test(params.month || "") ? params.month! : "";
    const [book, entries] = await Promise.all([store.getCashBook(), store.listCashEntries()]);
    const snapshot = settleCash(book, entries, { month, account: "all", flow: "all", query: "" });
    const report: ReportDocument = {
      tone: "student",
      kicker: "CASH AND BANK BOOK",
      title: "Cash & Bank",
      subtitle: month ? monthName(month) : "All months",
      generated,
      stats: [
        { label: "Cash", value: rupees(snapshot.cash) },
        { label: "Bank", value: rupees(snapshot.bank) },
        { label: "Inflow", value: rupees(snapshot.periodIn) },
        { label: "Outflow", value: rupees(snapshot.periodOut) },
      ],
      columns: ["S.No", "Date", "Type", "Account", "Party", "Amount"],
      rows: snapshot.rows.map((row, index) => [
        String(index + 1),
        dayStamp(row.entry.date),
        row.entry.flow === "in" ? "Inflow" : row.entry.flow === "out" ? "Outflow" : "Transfer",
        row.entry.account === "cash" ? "Cash" : "Bank",
        row.entry.party || row.entry.description || row.entry.category,
        rupees(row.entry.amount),
      ]),
      footer: "Skillvantage • Cash and bank book • Opening balances are not income",
    };
    return (
      <Letterhead
        report={report}
        back="/admin/cash"
        summary={`Skillvantage cash book\nCash ${rupees(snapshot.cash)}\nBank ${rupees(snapshot.bank)}\nNet ${rupees(snapshot.net)}`}
        fileName="Skillvantage-cash-book.pdf"
      />
    );
  }

  const batches = await store.listBatches();
  const audienceFilter = params.audience === "student" || params.audience === "professional" ? params.audience : "all";
  const batch = batches.find((item) => item.id === params.batch);
  if (!batch && section === "attendance") {
    const visible = batches.filter((item) => audienceFilter === "all" || item.learnerType === audienceFilter);
    const members = (await Promise.all(visible.map((item) => store.listMembers(item.id)))).flat().sort((a, b) => a.fullName.localeCompare(b.fullName));
    const marks = (await Promise.all(visible.map((item) => store.listAttendance(item.id)))).flat().filter((mark) => mark.date === date);
    const count = (status: ClassDayStatus) => marks.filter((mark) => mark.status === status && members.some((member) => member.id === mark.memberId)).length;
    const present = count("present");
    const absent = count("absent");
    const leave = count("leave");
    const late = count("late");
    const holiday = count("holiday");
    const rated = present + late + absent + leave;
    const rate = rated ? `${Math.round(((present + late) / rated) * 100)}%` : "0%";
    const who = audienceFilter === "student" ? "Students" : audienceFilter === "professional" ? "Professionals" : "All batches";
    const report: ReportDocument = {
      tone: audienceFilter === "professional" ? "professional" : "student",
      kicker: "DAILY ATTENDANCE REPORT",
      title: who,
      subtitle: dayStamp(date),
      generated,
      stats: [
        { label: "Present", value: String(present) },
        { label: "Absent", value: String(absent) },
        { label: "Leave", value: String(leave) },
        { label: "Late join", value: String(late) },
        { label: "Holiday", value: String(holiday) },
        { label: "Attendance", value: rate },
      ],
      columns: ["S.No", "Name", "Batch", "Status"],
      rows: members.map((member, index) => [
        String(index + 1),
        member.fullName,
        visible.find((item) => item.id === member.batchId)?.name || "Batch",
        statusLabel(marks.find((mark) => mark.memberId === member.id)?.status),
      ]),
      footer: "P = Present • A = Absent • L = Leave • LJ = Late join • H = Holiday • Skillvantage • Daily Attendance Report",
    };
    return (
      <Letterhead
        report={report}
        back="/admin/attendance"
        summary={`Skillvantage daily attendance\n${dayStamp(date)}\nPresent ${present}\nAbsent ${absent}\nLeave ${leave}\nLate join ${late}\nHoliday ${holiday}\nAttendance ${rate}`}
        fileName={`Skillvantage-daily-${date}.pdf`}
      />
    );
  }
  if (!batch) {
    return <BatchChooser section={section} batches={batches} date={date} />;
  }

  const members = (await store.listMembers(batch.id)).sort((a, b) => a.fullName.localeCompare(b.fullName));
  const tone = toneOf(batch.learnerType);
  const audience = batch.learnerType === "professional" ? "Professionals" : "Students";
  const fileName = `Skillvantage-${safeFile(batch.name)}-${date}.pdf`;

  if (section === "assignments") {
    const items = (await store.listAssignments(batch.id)).filter((item) => item.batchId === batch.id);
    const pending = items.filter((item) => item.status === "pending").length;
    const submitted = items.filter((item) => item.status === "submitted").length;
    const reviewed = items.filter((item) => item.status === "reviewed").length;
    const report: ReportDocument = {
      tone,
      kicker: "ASSIGNMENT REPORT",
      title: batch.name,
      subtitle: `${audience} • ${dayStamp(date)}`,
      generated,
      stats: [
        { label: "Work", value: String(items.length) },
        { label: "Pending", value: String(pending) },
        { label: "Submitted", value: String(submitted) },
        { label: "Reviewed", value: String(reviewed) },
      ],
      columns: ["S.No", audience === "Students" ? "Student Name" : "Professional", "Work", "Due", "Status"],
      rows: items.map((item, index) => [
        String(index + 1),
        members.find((member) => member.id === item.memberId)?.fullName || "Learner",
        item.title,
        item.dueOn,
        item.status[0]?.toUpperCase() + item.status.slice(1),
      ]),
      footer: `Skillvantage • ${batch.name} • Assignment report`,
    };
    return (
      <Letterhead
        report={report}
        back="/admin/assignments"
        summary={`Skillvantage ${batch.name} assignments\n${items.length} pieces of work`}
        fileName={fileName}
      />
    );
  }

  const marks = (await store.listAttendance(batch.id)).filter((mark) => mark.batchId === batch.id && mark.date === date);
  const count = (status: ClassDayStatus) => marks.filter((mark) => mark.status === status).length;
  const present = count("present");
  const absent = count("absent");
  const leave = count("leave");
  const late = count("late");
  const holiday = count("holiday");
  const rated = present + late + absent + leave;
  const rate = rated ? `${Math.round(((present + late) / rated) * 100)}%` : "0%";
  const report: ReportDocument = {
    tone,
    kicker: "DAILY ATTENDANCE REPORT",
    title: batch.name,
    subtitle: `${audience} • ${dayStamp(date)}`,
    generated,
    stats: [
      { label: "Present", value: String(present) },
      { label: "Absent", value: String(absent) },
      { label: "Leave", value: String(leave) },
      { label: "Late join", value: String(late) },
      { label: "Holiday", value: String(holiday) },
      { label: "Attendance", value: rate },
    ],
    columns: ["S.No", audience === "Students" ? "Student Name" : "Professional", "Year / Course", "Status"],
    rows: members.map((member, index) => [
      String(index + 1),
      member.fullName,
      member.note || "—",
      statusLabel(marks.find((mark) => mark.memberId === member.id)?.status),
    ]),
    footer: "P = Present • A = Absent • L = Leave • LJ = Late join • H = Holiday • Skillvantage • Daily Attendance Report",
  };
  return (
    <Letterhead
      report={report}
      back="/admin/attendance"
      summary={`Skillvantage ${batch.name}\n${dayStamp(date)}\nPresent ${present}\nAbsent ${absent}\nLeave ${leave}\nLate join ${late}\nHoliday ${holiday}\nAttendance ${rate}`}
      fileName={fileName}
    />
  );
}

function BatchChooser({ section, batches, date }: { section: "attendance" | "assignments"; batches: TrainingBatch[]; date: string }) {
  const title = section === "assignments" ? "assignment" : "attendance";
  return (
    <div className="mx-auto grid max-w-3xl gap-3">
      <div>
        <h1 className="text-2xl font-semibold">Choose one batch</h1>
        <p className="mt-1 text-sm text-[var(--desk-muted)]">The {title} PDF includes only the batch you open, for {dayStamp(date)}.</p>
      </div>
      {batches.length === 0 ? <p className="rounded-2xl border border-dashed border-[var(--desk-line)] p-8 text-sm text-[var(--desk-muted)]">Add a batch first.</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {batches.map((batch) => {
          const tone = toneOf(batch.learnerType);
          const color = tone === "professional" ? "#312e81" : "#065f46";
          return (
            <Link key={batch.id} href={`/admin/print?section=${section}&batch=${batch.id}&date=${date}`} className="rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] p-4">
              <p className="text-xs font-semibold tracking-[0.14em] uppercase" style={{ color }}>{batch.learnerType === "professional" ? "Professionals" : "Students"}</p>
              <p className="mt-1 text-xl font-semibold">{batch.name}</p>
              <p className="mt-1 text-sm text-[var(--desk-muted)]">{batch.label}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
