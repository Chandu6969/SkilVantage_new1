import Link from "next/link";
import { DeskHeader, DeskTitle } from "@/components/admin/desk-header";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const batches = await getStore().listBatches();
  return (
    <div>
      <DeskHeader eyebrow="Attendance" title={<DeskTitle />} subtitle="Open a batch and mark who is absent today. The list on the batch screen can filter to those people." />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {batches.map((batch) => (
          <Link key={batch.id} href={`/admin/batches/${batch.id}`} className="rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] p-4">
            <p className="text-xs tracking-[0.14em] text-[var(--desk-muted)] uppercase">{batch.learnerType === "student" ? "Student" : "Professional"} · {batch.label}</p>
            <p className="mt-1 text-xl font-semibold">{batch.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
