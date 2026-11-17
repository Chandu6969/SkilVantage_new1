import { FacultyBoard } from "@/components/admin/faculty-board";
import { TeacherBoard } from "@/components/admin/teacher-board";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function TeacherPage() {
  const store = getStore();
  const [teachers, days, pays, batches, notes] = await Promise.all([
    store.listFaculty(),
    store.listFacultyDays(),
    store.listFacultyPays(),
    store.listBatches(),
    store.listTeacherNotes(),
  ]);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Calcutta" });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Teachers</h1>
      <p className="mt-1 text-sm text-[var(--desk-muted)]">Add each teacher, the course they take, whether they attended that calendar day, and the class amount still to pay.</p>
      <div className="mt-5">
        <FacultyBoard teachers={teachers} days={days} pays={pays} today={today} />
      </div>
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Class notes</h2>
        <p className="mt-1 text-sm text-[var(--desk-muted)]">A short note stays with the batch it belongs to.</p>
        <div className="mt-4">
          <TeacherBoard batches={batches} notes={notes} />
        </div>
      </div>
    </div>
  );
}
