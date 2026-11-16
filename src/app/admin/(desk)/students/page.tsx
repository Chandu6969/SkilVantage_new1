import Link from "next/link";
import { AddBatchForm } from "@/components/admin/add-batch-form";
import { DeskHeader, DeskTitle } from "@/components/admin/desk-header";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const batches = await getStore().listBatches("student");
  const counts = await Promise.all(batches.map(async (batch) => (await getStore().listMembers(batch.id)).length));

  return (
    <div>
      <DeskHeader eyebrow="Students" title={<DeskTitle />} subtitle="College batches. SASI is the first, WISE is the second." />
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-3">
          {batches.map((batch, index) => (
            <Link key={batch.id} href={`/admin/batches/${batch.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] px-4 py-4 hover:border-[#14967c]">
              <span>
                <span className="block text-xs tracking-[0.14em] text-[#8ee0c0] uppercase">{batch.label}</span>
                <span className="mt-1 block text-2xl font-semibold">{batch.name}</span>
                <span className="mt-1 block text-sm text-[var(--desk-muted)]">{counts[index]} students</span>
              </span>
              <span className="rounded-full bg-[#14967c] px-3 py-1.5 text-sm text-white">Open</span>
            </Link>
          ))}
        </div>
        <AddBatchForm learnerType="student" />
      </div>
    </div>
  );
}
