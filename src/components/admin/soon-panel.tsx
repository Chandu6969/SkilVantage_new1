import { DeskHeader, DeskTitle } from "@/components/admin/desk-header";

export function SoonPanel({ eyebrow, subtitle }: { eyebrow: string; subtitle: string }) {
  return (
    <div>
      <DeskHeader eyebrow={eyebrow} title={<DeskTitle />} subtitle={subtitle} />
      <p className="mt-4 rounded-2xl border border-dashed border-[var(--desk-line)] bg-[var(--desk-card)] px-5 py-10 text-sm text-[var(--desk-muted)]">
        This section is ready in the desk. It stays empty until you add the people for a batch and tell me what should live here.
      </p>
    </div>
  );
}
