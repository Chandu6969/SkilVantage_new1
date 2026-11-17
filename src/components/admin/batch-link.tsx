import Link from "next/link";
import { batchLook } from "@/lib/batches";
import type { TrainingBatch } from "@/lib/types";

export function BatchLink({ batch, count, noun }: { batch: TrainingBatch; count: number; noun: string }) {
  const look = batchLook(batch);
  return (
    <Link
      href={`/admin/batches/${batch.id}`}
      className="flex items-center justify-between gap-3 rounded-2xl px-4 py-4"
      style={{
        color: look.from,
        background: `linear-gradient(160deg, color-mix(in srgb, ${look.to} 42%, white), color-mix(in srgb, ${look.from} 12%, white))`,
        border: `1px solid color-mix(in srgb, ${look.to} 55%, white)`,
        boxShadow: "0 14px 32px rgb(16 40 32 / 0.08)",
      }}
    >
      <span>
        <span className="block text-xs font-semibold tracking-[0.14em] uppercase">{batch.label}</span>
        <span className="mt-1 block text-2xl font-semibold">{batch.name}</span>
        <span className="mt-1 block text-sm">{count} {noun}{count === 1 ? "" : "s"}</span>
      </span>
      <span className="rounded-full px-3 py-1.5 text-sm text-white" style={{ background: look.from }}>Open</span>
    </Link>
  );
}
