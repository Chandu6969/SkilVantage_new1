import Link from "next/link";
import { Letterhead } from "@/components/admin/letterhead";
import { classPay } from "@/lib/faculty";
import { programName } from "@/lib/palette";
import type { ReportDocument, ReportTone } from "@/lib/report-pdf";
import { getStore } from "@/lib/store";
import type { ClassDayStatus, LearnerType, TrainingBatch } from "@/lib/types";

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
  if (status === "holiday") return "Holiday";
  return "Not marked";
}

export default async function PrintPage({ searchParams }: { searchParams: Promise<{ section?: string; batch?: string; date?: string }> }) {
  const params = await searchParams;
  const section = params.section === "assignments" || params.section === "teachers" ? params.section : "attendance";
  const store = getStore();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Calcutta" });
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date || "") ? params.date! : today;
  const generated = generatedStamp();

  if (section === "teachers") {
    const [teachers, pays] = await Promise.all([store.listFaculty(), store.listFacultyPays()]);
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

  const batches = await store.listBatches();
  const batch = batches.find((item) => item.id === params.batch);
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
  const holiday = count("holiday");
  const rated = present + absent + leave;
  const rate = rated ? `${Math.round((present / rated) * 100)}%` : "0%";
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
    footer: "P = Present • A = Absent • L = Leave • H = Holiday • Skillvantage • Daily Attendance Report",
  };
  return (
    <Letterhead
      report={report}
      back="/admin/attendance"
      summary={`Skillvantage ${batch.name}\n${dayStamp(date)}\nPresent ${present}\nAbsent ${absent}\nLeave ${leave}\nHoliday ${holiday}\nAttendance ${rate}`}
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
