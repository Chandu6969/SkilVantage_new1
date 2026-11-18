import Link from "next/link";
import { BatchRename } from "@/components/admin/batch-rename";
import { DeleteBatch } from "@/components/admin/delete-batch";
import { batchLook } from "@/lib/batches";
import type { TrainingBatch } from "@/lib/types";

export function BatchLink({ batch, count, noun }: { batch: TrainingBatch; count: number; noun: string }) {
  const look = batchLook(batch);
  const people = `${count} ${noun}${count === 1 ? "" : "s"}`;
  return (
    <article
      className="flex items-center justify-between gap-3 rounded-2xl px-4 py-4"
      style={{
        color: look.from,
        background: `linear-gradient(160deg, color-mix(in srgb, ${look.to} 42%, white), color-mix(in srgb, ${look.from} 12%, white))`,
        border: `1px solid color-mix(in srgb, ${look.to} 55%, white)`,
        boxShadow: "0 14px 32px rgb(16 40 32 / 0.08)",
      }}
    >
      <Link href={`/admin/batches/${batch.id}`} className="min-w-0 flex-1">
        <span className="block text-xs font-semibold tracking-[0.14em] uppercase">{batch.label}</span>
        <span className="mt-1 block text-2xl font-semibold">{batch.name}</span>
        <span className="mt-1 block text-sm">{people}</span>
      </Link>
      <span className="flex shrink-0 flex-col items-end gap-2">
        <Link href={`/admin/batches/${batch.id}`} className="rounded-full px-3 py-1.5 text-sm text-white" style={{ background: look.from }}>Open</Link>
        <BatchRename batch={batch} tone={look.from} />
        <DeleteBatch id={batch.id} name={batch.name} count={count} back={batch.learnerType === "student" ? "/admin/students" : "/admin/professionals"} />
      </span>
    </article>
  );
}
