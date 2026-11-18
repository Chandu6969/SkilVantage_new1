import { AttendanceBoard } from "@/components/admin/attendance-board";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ batch?: string }> }) {
  const params = await searchParams;
  const store = getStore();
  const batches = await store.listBatches();
  const members = (await Promise.all(batches.map((batch) => store.listMembers(batch.id)))).flat();
  const marks = (await Promise.all(batches.map((batch) => store.listAttendance(batch.id)))).flat();
  return (
    <div>
      <p className="inline-flex items-center gap-1.5 rounded-full bg-[#0f766e] px-3 py-1 text-xs font-semibold tracking-[0.14em] text-white uppercase">Attendance</p>
      <div className="mt-4"><AttendanceBoard batches={batches} members={members} marks={marks} initialBatch={params.batch || ""} /></div>
    </div>
  );
}
