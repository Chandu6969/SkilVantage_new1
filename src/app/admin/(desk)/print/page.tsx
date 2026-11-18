import Link from "next/link";
import { ReportActions } from "@/components/admin/report-actions";
import { classPay } from "@/lib/faculty";
import { programName } from "@/lib/palette";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

function rupees(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export default async function PrintPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const section = (await searchParams).section;
  const kind = section === "assignments" || section === "teachers" ? section : "attendance";
  const store = getStore();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Calcutta" });

  if (kind === "teachers") {
    const [teachers, pays] = await Promise.all([store.listFaculty(), store.listFacultyPays()]);
    const due = pays.filter((pay) => pay.status === "due").reduce((sum, pay) => sum + pay.amount, 0);
    const paid = pays.filter((pay) => pay.status === "paid").reduce((sum, pay) => sum + pay.amount, 0);
    const lines = ["SkilVantage teachers", `Day ${today}`, "", `Unpaid ${rupees(due)}`, `Paid ${rupees(paid)}`];
    for (const teacher of teachers) {
      const owed = pays.filter((pay) => pay.teacherId === teacher.id && pay.status === "due").reduce((sum, pay) => sum + pay.amount, 0);
      const settled = pays.filter((pay) => pay.teacherId === teacher.id && pay.status === "paid").reduce((sum, pay) => sum + pay.amount, 0);
      lines.push("", `${teacher.fullName}  ${programName(teacher.course)}  ${rupees(classPay(teacher.rate))} a class`, `Unpaid ${rupees(owed)}  Paid ${rupees(settled)}`);
      const rows = pays.filter((pay) => pay.teacherId === teacher.id);
      if (rows.length === 0) lines.push("  No class pay yet");
      for (const pay of rows) lines.push(`  ${pay.classDate}  ${rupees(pay.amount)}  ${pay.status}${pay.paidOn ? ` ${pay.paidOn}` : ""}`);
    }
    return (
      <Sheet
        back="/admin/teacher"
        title="Teachers"
        note={`${today} · unpaid ${rupees(due)} · paid ${rupees(paid)}`}
        lines={lines}
        summary={`SkilVantage teachers\nUnpaid ${rupees(due)}\nPaid ${rupees(paid)}`}
        fileName="SkilVantage-teachers.pdf"
      >
        {teachers.map((teacher) => (
          <div key={teacher.id} className="mt-4">
            <h2 className="font-medium">{teacher.fullName} · {programName(teacher.course)} · {rupees(classPay(teacher.rate))} a class</h2>
            <PayTable pays={pays.filter((pay) => pay.teacherId === teacher.id)} />
          </div>
        ))}
        {teachers.length === 0 ? <p className="mt-3 text-sm text-[#3d4a57]">No teachers yet.</p> : null}
      </Sheet>
    );
  }

  const batches = await store.listBatches();
  const members = (await Promise.all(batches.map((batch) => store.listMembers(batch.id)))).flat();

  if (kind === "assignments") {
    const assignments = await store.listAssignments();
    const lines = ["SkilVantage assignments", `Day ${today}`, ""];
    if (assignments.length === 0) lines.push("No assignments yet");
    for (const item of assignments) {
      const member = members.find((row) => row.id === item.memberId);
      const batch = batches.find((row) => row.id === item.batchId);
      lines.push(`${member?.fullName || "Learner"}  ${batch?.name || ""}  ${item.title}  due ${item.dueOn}  ${item.status}`);
    }
    return (
      <Sheet
        back="/admin/assignments"
        title="Assignments"
        note={`${today} · ${assignments.length} assignments`}
        lines={lines}
        summary={`SkilVantage assignments\n${assignments.length} assignments`}
        fileName="SkilVantage-assignments.pdf"
      >
        <table className="mt-3 w-full text-left text-sm">
          <thead><tr className="text-[#3d4a57]"><th className="py-1 font-medium">Name</th><th className="py-1 font-medium">Batch</th><th className="py-1 font-medium">Work</th><th className="py-1 font-medium">Due</th><th className="py-1 font-medium">Status</th></tr></thead>
          <tbody>
            {assignments.map((item) => (
              <tr key={item.id} className="border-t border-black/10">
                <td className="py-1">{members.find((member) => member.id === item.memberId)?.fullName || "Learner"}</td>
                <td className="py-1">{batches.find((batch) => batch.id === item.batchId)?.name || ""}</td>
                <td className="py-1">{item.title}</td>
                <td className="py-1">{item.dueOn}</td>
                <td className="py-1 capitalize">{item.status}</td>
              </tr>
            ))}
            {assignments.length === 0 ? <tr><td className="py-2 text-[#3d4a57]" colSpan={5}>No assignments yet.</td></tr> : null}
          </tbody>
        </table>
      </Sheet>
    );
  }

  const marks = (await Promise.all(batches.map((batch) => store.listAttendance(batch.id)))).flat();
  const presentToday = marks.filter((mark) => mark.date === today && mark.status === "present").length;
  const absentToday = marks.filter((mark) => mark.date === today && mark.status === "absent").length;
  const lines = ["SkilVantage attendance", `Day ${today}`, "", `Present today ${presentToday}`, `Absent today ${absentToday}`];
  for (const batch of batches) {
    const roster = members.filter((member) => member.batchId === batch.id);
    lines.push("", `${batch.name} (${batch.learnerType === "student" ? "students" : "professionals"})`);
    if (roster.length === 0) lines.push("  No names yet");
    for (const member of roster) {
      const rows = marks.filter((mark) => mark.memberId === member.id);
      lines.push(`  ${member.fullName}  present ${rows.filter((mark) => mark.status === "present").length}  absent ${rows.filter((mark) => mark.status === "absent").length}  today ${rows.find((mark) => mark.date === today)?.status || "not marked"}`);
    }
  }
  return (
    <Sheet
      back="/admin/attendance"
      title="Attendance"
      note={`${today} · present ${presentToday} · absent ${absentToday}`}
      lines={lines}
      summary={`SkilVantage attendance\nPresent today ${presentToday}\nAbsent today ${absentToday}`}
      fileName="SkilVantage-attendance.pdf"
    >
      {batches.map((batch) => {
        const roster = members.filter((member) => member.batchId === batch.id);
        return (
          <div key={batch.id} className="mt-4">
            <h2 className="font-medium">{batch.name} · {batch.learnerType === "student" ? "Students" : "Professionals"}</h2>
            <table className="mt-2 w-full text-left text-sm">
              <thead><tr className="text-[#3d4a57]"><th className="py-1 font-medium">Name</th><th className="py-1 font-medium">Present</th><th className="py-1 font-medium">Absent</th><th className="py-1 font-medium">Today</th></tr></thead>
              <tbody>
                {roster.map((member) => {
                  const rows = marks.filter((mark) => mark.memberId === member.id);
                  return (
                    <tr key={member.id} className="border-t border-black/10">
                      <td className="py-1">{member.fullName}</td>
                      <td className="py-1">{rows.filter((mark) => mark.status === "present").length}</td>
                      <td className="py-1">{rows.filter((mark) => mark.status === "absent").length}</td>
                      <td className="py-1 capitalize">{rows.find((mark) => mark.date === today)?.status || "Not marked"}</td>
                    </tr>
                  );
                })}
                {roster.length === 0 ? <tr><td className="py-2 text-[#3d4a57]" colSpan={4}>No names yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
        );
      })}
    </Sheet>
  );
}

function PayTable({ pays }: { pays: { id: string; classDate: string; amount: number; status: string; paidOn: string }[] }) {
  if (pays.length === 0) return <p className="mt-2 text-sm text-[#3d4a57]">No class pay yet.</p>;
  return (
    <table className="mt-2 w-full text-left text-sm">
      <thead><tr className="text-[#3d4a57]"><th className="py-1 font-medium">Class day</th><th className="py-1 font-medium">Amount</th><th className="py-1 font-medium">Status</th></tr></thead>
      <tbody>
        {pays.map((pay) => (
          <tr key={pay.id} className="border-t border-black/10">
            <td className="py-1">{pay.classDate}</td>
            <td className="py-1">{rupees(pay.amount)}</td>
            <td className="py-1 capitalize">{pay.status}{pay.paidOn ? ` ${pay.paidOn}` : ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Sheet({
  back,
  title,
  note,
  lines,
  summary,
  fileName,
  children,
}: {
  back: string;
  title: string;
  note: string;
  lines: string[];
  summary: string;
  fileName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="print-sheet grid gap-4 text-[#14211c]">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href={back} className="text-sm text-[var(--desk-muted)] hover:underline">Back</Link>
        <ReportActions lines={lines} summary={summary} fileName={fileName} />
      </div>
      <header className="rounded-3xl bg-white p-5">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#065f46] uppercase">SkilVantage</p>
        <h1 className="mt-1 text-3xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-[#3d4a57]">{note}</p>
      </header>
      <section className="rounded-3xl bg-white p-5">{children}</section>
    </div>
  );
}
