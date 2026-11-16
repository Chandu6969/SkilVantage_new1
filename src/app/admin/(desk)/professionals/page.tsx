import Link from "next/link";
import { AddBatchForm } from "@/components/admin/add-batch-form";
import { DeskHeader, DeskTitle } from "@/components/admin/desk-header";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ProfessionalsPage() {
  const batches = await getStore().listBatches("professional");
  const counts = await Promise.all(batches.map(async (batch) => (await getStore().listMembers(batch.id)).length));

  return (
    <div>
      <DeskHeader eyebrow="Professionals" title={<DeskTitle />} subtitle="Working professionals are kept out of the student batches." />
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-3">
          {batches.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--desk-line)] bg-[var(--desk-card)] px-4 py-10 text-sm text-[var(--desk-muted)]">
              No professional batch yet. Add one, then enter each person on the batch screen.
            </p>
          ) : batches.map((batch, index) => (
            <Link key={batch.id} href={`/admin/batches/${batch.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] px-4 py-4 hover:border-[#14967c]">
              <span>
                <span className="block text-xs tracking-[0.14em] text-[#8ee0c0] uppercase">{batch.label}</span>
                <span className="mt-1 block text-2xl font-semibold">{batch.name}</span>
                <span className="mt-1 block text-sm text-[var(--desk-muted)]">{counts[index]} professionals</span>
              </span>
              <span className="rounded-full bg-[#14967c] px-3 py-1.5 text-sm text-white">Open</span>
            </Link>
          ))}
        </div>
        <AddBatchForm learnerType="professional" />
      </div>
    </div>
  );
}
