import Link from "next/link";
import { FacultyBoard } from "@/components/admin/faculty-board";
import { PrintLink } from "@/components/admin/print-link";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function TeacherPage() {
  const store = getStore();
  const [teachers, pays] = await Promise.all([store.listFaculty(), store.listFacultyPays()]);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Calcutta" });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-[#0f766e] px-3 py-1 text-xs font-semibold tracking-[0.14em] text-white uppercase">Teachers</p>
        <div className="flex flex-wrap gap-2">
          <PrintLink section="teachers" />
          <Link href="/admin/teacher/new" className="inline-flex h-10 items-center rounded-full bg-[#14967c] px-4 text-sm font-medium text-white">Add teacher</Link>
        </div>
      </div>
      <div className="mt-4">
        <FacultyBoard teachers={teachers} pays={pays} today={today} />
      </div>
    </div>
  );
}
