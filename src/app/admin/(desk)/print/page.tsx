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

function shortDay(iso: string) {
  const day = iso.slice(0, 10);
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return iso || "—";
  return new Date(Date.UTC(year, month - 1, date)).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

function longDay(iso: string) {
  const [year, month, date] = iso.split("-").map(Number);
  if (!year || !month || !date) return iso;
  return new Date(Date.UTC(year, month - 1, date)).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function monthTitle(key: string) {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

function issueDate(month: string, today: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const last = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
  return today.startsWith(month) && today < last ? today : last;
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
    const [listedTeachers, listedPays] = await Promise.all([store.listFaculty(), store.listFacultyPays()]);
    const chosen = listedTeachers.find((teacher) => teacher.id === params.id);
    const teachers = chosen ? [chosen] : listedTeachers;
    const classes = listedPays.filter((pay) => pay.kind !== "deducted" && teachers.some((teacher) => teacher.id === pay.teacherId));
    const monthKeys = [...new Set(classes.map((pay) => pay.classDate.slice(0, 7)).filter((key) => /^\d{4}-\d{2}$/.test(key)))].sort();
    const askedMonth = /^\d{4}-\d{2}$/.test(params.month || "") ? params.month! : "";
    const month = askedMonth || (chosen ? "" : monthKeys.at(-1) || today.slice(0, 7));
    const monthClasses = (month ? classes.filter((pay) => pay.classDate.startsWith(month)) : classes).sort((a, b) => a.classDate.localeCompare(b.classDate) || a.createdAt.localeCompare(b.createdAt));
    const covered = [...new Set(monthClasses.map((pay) => pay.classDate.slice(0, 7)))].sort();
    const period = month ? monthTitle(month) : covered.length > 1 ? `${monthTitle(covered[0]!)} – ${monthTitle(covered.at(-1)!)}` : covered[0] ? monthTitle(covered[0]) : "All classes";
    const taughtThisMonth = chosen ? teachers : teachers.filter((teacher) => monthClasses.some((pay) => pay.teacherId === teacher.id));
    const roster = taughtThisMonth.length ? taughtThisMonth : teachers;
    const total = monthClasses.reduce((sum, pay) => sum + pay.amount, 0);
    const issued = month ? issueDate(month, today) : today;
    const report: ReportDocument = {
      tone: "student",
      kicker: "TEACHER PAYMENT",
      title: "Skill Vantage - Teacher Details",
      subtitle: `Teacher information and class record • ${period}`,
      generated,
      stats: [
        { label: "Teachers listed", value: String(roster.length) },
        { label: "Classes taken", value: String(monthClasses.length) },
        { label: "Total payment", value: rupees(total) },
      ],
      tableHeading: "Teacher Details",
      columns: ["Teacher Name", "Phone", "Email", "Subject / Course", "Joining Date", "Status", "Month Classes", "Total Classes"],
      rows: roster.map((teacher) => {
        const taught = classes.filter((pay) => pay.teacherId === teacher.id);
        const thisMonth = taught.filter((pay) => pay.classDate.startsWith(month));
        return [
          teacher.fullName,
          teacher.phone || "—",
          teacher.email || "No Email",
          programName(teacher.course),
          shortDay(teacher.createdAt),
          "ACTIVE",
          String(thisMonth.length),
          String(taught.length),
        ];
      }),
      sections: [
        {
          heading: `Teacher Payment Summary • ${period}`,
          columns: ["Teacher Name", "Subject / Course", "Classes Taken", "Amount / Class", "Total Amount"],
          rows: roster.map((teacher) => {
            const rows = monthClasses.filter((pay) => pay.teacherId === teacher.id);
            return [teacher.fullName, programName(teacher.course), String(rows.length), rupees(classPay(teacher.rate)), rupees(rows.reduce((sum, pay) => sum + pay.amount, 0))];
          }),
          foot: `Month Total: ${rupees(total)}`,
        },
        {
          heading: `Teacher Class Record • ${period}`,
          columns: ["Date", "Teacher Name", "Course / Subject", "Class / Session", "Amount / Class", "Status"],
          rows: monthClasses.map((pay) => {
            const teacher = roster.find((item) => item.id === pay.teacherId) || teachers.find((item) => item.id === pay.teacherId);
            return [
              shortDay(pay.classDate),
              teacher?.fullName || "Teacher",
              pay.subject || (teacher ? programName(teacher.course) : "Course"),
              pay.session || "Class",
              rupees(pay.amount),
              "TAKEN",
            ];
          }),
        },
      ],
      signOff: { issued: longDay(issued), period },
      footer: "Skill Vantage • Teacher Management Record • Printed document",
    };
    const fileName = `Skillvantage-Teacher-Payment-${chosen ? `${safeFile(chosen.fullName)}-` : ""}${period.replace(/\s+/g, "-")}.pdf`;
    return (
      <Letterhead
        report={report}
        back={chosen ? `/admin/teacher/${chosen.id}` : "/admin/teacher"}
        summary={`Skillvantage teacher payment\n${period}\n${roster.map((teacher) => teacher.fullName).join(", ") || "No teacher"}\nTotal ${rupees(total)}`}
        fileName={fileName}
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
  const month = /^\d{4}-\d{2}$/.test(params.month || "") ? params.month! : "";
  if (section === "attendance" && month) {
    const visible = batch ? [batch] : batches.filter((item) => audienceFilter === "all" || item.learnerType === audienceFilter);
    const members = (await Promise.all(visible.map((item) => store.listMembers(item.id)))).flat().sort((a, b) => {
      const order = (visible.find((item) => item.id === a.batchId)?.sort || 0) - (visible.find((item) => item.id === b.batchId)?.sort || 0);
      return order || a.fullName.localeCompare(b.fullName);
    });
    const marks = (await Promise.all(visible.map((item) => store.listAttendance(item.id)))).flat().filter((mark) => mark.date.startsWith(month));
    const marked = new Map(marks.map((mark) => [`${mark.memberId}|${mark.date}`, mark.status]));
    const days = monthDays(month);
    const tally = { present: 0, absent: 0, leave: 0, late: 0, holiday: 0 };
    for (const member of members) {
      for (const day of days) {
        if (day.iso > today) continue;
        const status = marked.get(`${member.id}|${day.iso}`);
        if (status && status in tally) tally[status as keyof typeof tally] += 1;
      }
    }
    const rated = tally.present + tally.late + tally.absent + tally.leave;
    const rate = rated ? `${Math.round(((tally.present + tally.late) / rated) * 100)}%` : "0%";
    const who = batch ? batch.name : audienceFilter === "student" ? "Students" : audienceFilter === "professional" ? "Professionals" : "All batches";
    const columns = ["S.No", "Name", ...days.map((day) => day.label)];
    const rows = members.map((member, index) => [
      String(index + 1),
      member.fullName,
      ...days.map((day) => markCode(marked.get(`${member.id}|${day.iso}`), day.off)),
    ]);
    const report: ReportDocument = {
      tone: batch ? toneOf(batch.learnerType) : audienceFilter === "professional" ? "professional" : "student",
      kicker: "MONTHLY ATTENDANCE REPORT",
      title: who,
      subtitle: monthTitle(month),
      generated,
      wide: true,
      stats: [
        { label: "Present", value: String(tally.present) },
        { label: "Absent", value: String(tally.absent) },
        { label: "Leave", value: String(tally.leave) },
        { label: "Late join", value: String(tally.late) },
        { label: "Attendance", value: rate },
      ],
      tableHeading: "Daily register",
      columns,
      rows,
      footer: "P = Present • A = Absent • L = Leave • LJ = Late join • H = Holiday • WO = Week off • Skillvantage • Monthly Attendance Report",
    };
    return (
      <Letterhead
        report={report}
        back="/admin/attendance"
        summary={`Skillvantage monthly attendance\n${monthTitle(month)}\n${who}\nPresent ${tally.present}\nAbsent ${tally.absent}\nLeave ${tally.leave}\nLate join ${tally.late}\nHoliday ${tally.holiday}\nAttendance ${rate}`}
        fileName={`Skillvantage-monthly-${month}${batch ? `-${safeFile(batch.name)}` : ""}.pdf`}
      />
    );
  }
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
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold">Open a batch first</h1>
        <p className="mt-1 text-sm text-[var(--desk-muted)]">Print uses the batch already open on the assignments page.</p>
        <Link href="/admin/assignments" className="mt-3 inline-block text-sm underline">Back to assignments</Link>
      </div>
    );
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

function monthDays(key: string) {
  const [year, month] = key.split("-").map(Number);
  const count = new Date(Date.UTC(year, month || 1, 0)).getUTCDate();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, (month || 1) - 1, index + 1));
    return { iso: date.toISOString().slice(0, 10), label: String(index + 1), off: date.getUTCDay() === 0 };
  });
}

function markCode(status: ClassDayStatus | undefined, off: boolean) {
  if (status === "present") return "P";
  if (status === "absent") return "A";
  if (status === "leave") return "L";
  if (status === "late") return "LJ";
  if (status === "holiday") return "H";
  return off ? "WO" : "—";
}

