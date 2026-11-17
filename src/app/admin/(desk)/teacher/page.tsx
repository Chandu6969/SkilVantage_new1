import { TeacherBoard } from "@/components/admin/teacher-board";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function TeacherPage() {
  const store = getStore();
  const batches = await store.listBatches();
  const notes = await store.listTeacherNotes();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Teacher</h1>
      <p className="mt-1 text-sm text-[var(--desk-muted)]">Keep class notes on the batch they belong to.</p>
      <div className="mt-5"><TeacherBoard batches={batches} notes={notes} /></div>
    </div>
  );
}
