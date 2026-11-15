import { phases, type Program } from "@/lib/content";

export function JourneyTimeline({ program }: { program: Program }) {
  return (
    <ol className="mx-auto max-w-3xl">
      {phases.map((phase, index) => {
        const items = program.phases[phase.id];
        const note = program.phaseNotes[phase.id];
        return (
          <li key={phase.id} className="grid grid-cols-[2.5rem_1fr] gap-4">
            <div className="flex flex-col items-center">
              <span className="grid size-10 place-items-center rounded-full bg-ink text-sm text-paper">{index + 1}</span>
              {index < phases.length - 1 ? <span className="my-1 w-px flex-1 bg-border" /> : null}
            </div>
            <div className={index < phases.length - 1 ? "pb-8" : ""}>
              <p className="text-xs font-medium tracking-[0.16em] text-copper uppercase">Step {String(index + 1).padStart(2, "0")}</p>
              <h3 className="mt-1 text-2xl text-ink">{phase.title}</h3>
              <p className="mt-2 text-muted-foreground">{note || phase.summary}</p>
              {items.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {items.map((item) => (
                    <li key={item} className="rounded-full border border-border bg-card px-3 py-1 text-sm">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
              {index < phases.length - 1 ? (
                <p className="mt-3 text-sm text-copper" aria-hidden="true">
                  ↓
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
