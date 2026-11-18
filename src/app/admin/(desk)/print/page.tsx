import Link from "next/link";
import { ReportActions } from "@/components/admin/report-actions";
import { classPay } from "@/lib/faculty";
import { programName } from "@/lib/palette";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

function rupees(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export default async function PrintPage() {
  const store = getStore();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Calcutta" });
  const [batches, fees, assignments, teachers, days, pays] = await Promise.all([
    store.listBatches(),
    store.listFees(),
    store.listAssignments(),
    store.listFaculty(),
    store.listFacultyDays(),
    store.listFacultyPays(),
  ]);
  const members = (await Promise.all(batches.map((batch) => store.listMembers(batch.id)))).flat();
  const marks = (await Promise.all(batches.map((batch) => store.listAttendance(batch.id)))).flat();
  const lines = [
    "SkilVantage report",
    `Day ${today}`,
    "",
    "ATTENDANCE",
  ];
  for (const batch of batches) {
    const roster = members.filter((member) => member.batchId === batch.id);
    lines.push(`${batch.name} (${batch.learnerType === "student" ? "students" : "professionals"})`);
    if (roster.length === 0) lines.push("  No names yet");
    for (const member of roster) {
      const rows = marks.filter((mark) => mark.memberId === member.id);
      const present = rows.filter((mark) => mark.status === "present").length;
      const absent = rows.filter((mark) => mark.status === "absent").length;
      const todayMark = rows.find((mark) => mark.date === today)?.status || "not marked";
      lines.push(`  ${member.fullName}  present ${present}  absent ${absent}  today ${todayMark}`);
    }
  }
  lines.push("", "ASSIGNMENTS");
  if (assignments.length === 0) lines.push("  No assignments yet");
  for (const item of assignments) {
    const member = members.find((row) => row.id === item.memberId);
    const batch = batches.find((row) => row.id === item.batchId);
    lines.push(`  ${member?.fullName || "Learner"}  ${batch?.name || ""}  ${item.title}  due ${item.dueOn}  ${item.status}`);
  }
  const due = pays.filter((pay) => pay.status === "due").reduce((sum, pay) => sum + pay.amount, 0);
  const paid = pays.filter((pay) => pay.status === "paid").reduce((sum, pay) => sum + pay.amount, 0);
  lines.push("", "TEACHER DUES", `Unpaid ${rupees(due)}`, `Paid ${rupees(paid)}`);
  for (const teacher of teachers) {
    const owed = pays.filter((pay) => pay.teacherId === teacher.id && pay.status === "due").reduce((sum, pay) => sum + pay.amount, 0);
    const settled = pays.filter((pay) => pay.teacherId === teacher.id && pay.status === "paid").reduce((sum, pay) => sum + pay.amount, 0);
    lines.push(`${teacher.fullName}  ${programName(teacher.course)}  ${rupees(classPay(teacher.rate))} a class  unpaid ${rupees(owed)}  paid ${rupees(settled)}`);
    for (const pay of pays.filter((item) => item.teacherId === teacher.id)) {
      lines.push(`  ${pay.classDate}  ${rupees(pay.amount)}  ${pay.status}${pay.paidOn ? ` ${pay.paidOn}` : ""}`);
    }
  }
  const presentToday = marks.filter((mark) => mark.date === today && mark.status === "present").length;
  const absentToday = marks.filter((mark) => mark.date === today && mark.status === "absent").length;
  const summary = [
    "SkilVantage report",
    `Today present ${presentToday}, absent ${absentToday}`,
    `Assignments ${assignments.length}`,
    `Teacher unpaid ${rupees(due)}, paid ${rupees(paid)}`,
    `Fees collected ${rupees(fees.reduce((sum, fee) => sum + fee.amount, 0))}`,
  ].join("\n");

  return (
    <div className="print-sheet grid gap-4 text-[#14211c]">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="text-sm text-[var(--desk-muted)] hover:underline">Back to desk</Link>
        <ReportActions lines={lines} summary={summary} />
      </div>
      <header className="rounded-3xl bg-white p-5">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#065f46] uppercase">SkilVantage</p>
        <h1 className="mt-1 text-3xl font-semibold">Attendance, assignments, and teacher dues</h1>
        <p className="mt-2 text-sm text-[#3d4a57]">{today} · present {presentToday} · absent {absentToday} · teacher unpaid {rupees(due)} · teacher paid {rupees(paid)}</p>
      </header>
      <section className="rounded-3xl bg-white p-5">
        <h2 className="text-xl font-semibold">Attendance</h2>
        {batches.map((batch) => {
          const roster = members.filter((member) => member.batchId === batch.id);
          return (
            <div key={batch.id} className="mt-4">
              <h3 className="font-medium">{batch.name} · {batch.learnerType === "student" ? "Students" : "Professionals"}</h3>
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
      </section>
      <section className="rounded-3xl bg-white p-5">
        <h2 className="text-xl font-semibold">Assignments</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead><tr className="text-[#3d4a57]"><th className="py-1 font-medium">Name</th><th className="py-1 font-medium">Work</th><th className="py-1 font-medium">Due</th><th className="py-1 font-medium">Status</th></tr></thead>
          <tbody>
            {assignments.map((item) => (
              <tr key={item.id} className="border-t border-black/10">
                <td className="py-1">{members.find((member) => member.id === item.memberId)?.fullName || "Learner"}</td>
                <td className="py-1">{item.title}</td>
                <td className="py-1">{item.dueOn}</td>
                <td className="py-1 capitalize">{item.status}</td>
              </tr>
            ))}
            {assignments.length === 0 ? <tr><td className="py-2 text-[#3d4a57]" colSpan={4}>No assignments yet.</td></tr> : null}
          </tbody>
        </table>
      </section>
      <section className="rounded-3xl bg-white p-5">
        <h2 className="text-xl font-semibold">Teacher dues</h2>
        <p className="mt-1 text-sm text-[#3d4a57]">Unpaid {rupees(due)} · Paid {rupees(paid)}</p>
        {teachers.map((teacher) => (
          <div key={teacher.id} className="mt-4">
            <h3 className="font-medium">{teacher.fullName} · {programName(teacher.course)} · {rupees(classPay(teacher.rate))} a class</h3>
            <table className="mt-2 w-full text-left text-sm">
              <thead><tr className="text-[#3d4a57]"><th className="py-1 font-medium">Class day</th><th className="py-1 font-medium">Amount</th><th className="py-1 font-medium">Status</th></tr></thead>
              <tbody>
                {pays.filter((pay) => pay.teacherId === teacher.id).map((pay) => (
                  <tr key={pay.id} className="border-t border-black/10">
                    <td className="py-1">{pay.classDate}</td>
                    <td className="py-1">{rupees(pay.amount)}</td>
                    <td className="py-1 capitalize">{pay.status}{pay.paidOn ? ` ${pay.paidOn}` : ""}</td>
                  </tr>
                ))}
                {pays.every((pay) => pay.teacherId !== teacher.id) ? <tr><td className="py-2 text-[#3d4a57]" colSpan={3}>No class pay yet. Days marked: {days.filter((day) => day.teacherId === teacher.id).length}.</td></tr> : null}
              </tbody>
            </table>
          </div>
        ))}
        {teachers.length === 0 ? <p className="mt-3 text-sm text-[#3d4a57]">No teachers yet.</p> : null}
      </section>
    </div>
  );
}
