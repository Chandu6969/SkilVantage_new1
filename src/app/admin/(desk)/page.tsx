import Link from "next/link";
import { DeskHeader, DeskTitle } from "@/components/admin/desk-header";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

const jumps = [
  { href: "/admin/students", label: "Students" },
  { href: "/admin/professionals", label: "Professionals" },
  { href: "/admin/attendance", label: "Take Attendance" },
  { href: "/admin/assignments", label: "Assignments" },
  { href: "/admin/cash", label: "Fee Dues" },
];

export default async function AdminHome() {
  const store = getStore();
  const [students, professionals, registrations] = await Promise.all([
    store.listBatches("student"),
    store.listBatches("professional"),
    store.listRegistrations(),
  ]);
  const studentPeople = (await Promise.all(students.map((batch) => store.listMembers(batch.id)))).reduce((sum, rows) => sum + rows.length, 0);
  const professionalPeople = (await Promise.all(professionals.map((batch) => store.listMembers(batch.id)))).reduce((sum, rows) => sum + rows.length, 0);
  const realLeads = registrations.filter((item) => !item.sample).length;

  return (
    <div>
      <DeskHeader
        eyebrow="New batch"
        title={<DeskTitle />}
        subtitle="Students and professionals stay in separate workspaces."
      />
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {jumps.map((item) => (
          <Link key={item.href} href={item.href} className="shrink-0 rounded-xl border border-[var(--desk-line)] bg-[var(--desk-card)] px-3 py-2 text-sm">
            {item.label}
          </Link>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Link href="/admin/students" className="rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] p-5 hover:border-[#14967c]">
          <p className="text-xs tracking-[0.16em] text-[var(--desk-muted)]">STUDENTS</p>
          <h2 className="mt-2 text-2xl font-semibold">Student batches</h2>
          <p className="mt-2 text-sm text-[var(--desk-muted)]">1st batch SASI and 2nd batch WISE are ready. Add another batch when a new classroom starts.</p>
          <p className="mt-4 text-sm">{students.length} batches · {studentPeople} students added</p>
        </Link>
        <Link href="/admin/professionals" className="rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] p-5 hover:border-[#14967c]">
          <p className="text-xs tracking-[0.16em] text-[var(--desk-muted)]">PROFESSIONALS</p>
          <h2 className="mt-2 text-2xl font-semibold">Working professionals</h2>
          <p className="mt-2 text-sm text-[var(--desk-muted)]">Kept apart from college batches. Add a professional batch and enter each person yourself.</p>
          <p className="mt-4 text-sm">{professionals.length} batches · {professionalPeople} professionals added</p>
        </Link>
      </div>
      <p className="mt-4 text-sm text-[var(--desk-muted)]">
        Website registrations stay in <Link href="/admin/leads" className="underline">Registrations</Link>
        {realLeads ? ` (${realLeads} saved).` : ". Sample records are hidden from the count until a real registration arrives."}
      </p>
    </div>
  );
}
