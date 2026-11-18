import Link from "next/link";
import { TeacherForm } from "@/components/admin/teacher-form";

export const dynamic = "force-dynamic";

export default function NewTeacherPage() {
  return (
    <div className="grid gap-4">
      <Link href="/admin/teacher" className="text-sm text-[var(--desk-muted)] hover:underline">All teachers</Link>
      <header className="rounded-3xl p-5 text-white" style={{ background: "linear-gradient(155deg, #065f46, #10b981)" }}>
        <p className="text-xs font-semibold tracking-[0.16em] uppercase">New teacher</p>
        <h1 className="mt-1 text-3xl font-semibold">Teacher details</h1>
        <p className="mt-2 text-sm text-white/85">Name, phone, course, and class pay. A present mark later adds this amount to unpaid.</p>
      </header>
      <TeacherForm />
    </div>
  );
}
