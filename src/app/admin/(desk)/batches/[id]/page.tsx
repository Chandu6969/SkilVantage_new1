import Link from "next/link";
import { notFound } from "next/navigation";
import { BatchBoard } from "@/components/admin/batch-board";
import { BatchRename } from "@/components/admin/batch-rename";
import { DeskHeader } from "@/components/admin/desk-header";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function BatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const batch = await store.getBatch(id);
  if (!batch) notFound();
  const members = await store.listMembers(id);
  const peers = await store.listBatches(batch.learnerType);
  const back = batch.learnerType === "student" ? "/admin/students" : "/admin/professionals";

  return (
    <div>
      <DeskHeader
        eyebrow={batch.label}
        title={<><span className="desk-skil">Skil</span><span className="text-white">Vantage</span> · {batch.name}</>}
        subtitle={`${batch.learnerType === "student" ? "Student" : "Professional"} communication · add people · WhatsApp`}
      />
      <div className="mt-4 flex gap-2 overflow-x-auto text-sm">
        <Link href={back} className="rounded-xl bg-[#14967c] px-3 py-2 text-white">{batch.learnerType === "student" ? "Students" : "Professionals"}</Link>
        <Link href={`/admin/attendance?batch=${batch.id}`} className="rounded-xl border border-[var(--desk-line)] bg-[var(--desk-card)] px-3 py-2">Take Attendance</Link>
        <Link href="/admin/assignments" className="rounded-xl border border-[var(--desk-line)] bg-[var(--desk-card)] px-3 py-2">Assignments</Link>
        <Link href="/admin/cash" className="rounded-xl border border-[var(--desk-line)] bg-[var(--desk-card)] px-3 py-2">Fee Dues</Link>
        <Link href="/admin/attendance" className="rounded-xl border border-[var(--desk-line)] bg-[var(--desk-card)] px-3 py-2">Attendance Reports</Link>
        <BatchRename batch={batch} tone="#065f46" />
      </div>
      <BatchBoard batch={batch} members={members} batches={peers} />
    </div>
  );
}
