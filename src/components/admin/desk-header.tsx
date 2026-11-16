import { deskDate } from "@/lib/batches";

export function DeskHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
}) {
  return (
    <header className="desk-hero">
      <div>
        <p className="desk-pill"><span className="size-1.5 rounded-full bg-[#b8ffd4]" /> {eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-white/80">{subtitle}</p>
      </div>
      <p className="shrink-0 text-sm text-white/90">{deskDate()}</p>
    </header>
  );
}

export function DeskTitle() {
  return (
    <>
      <span className="desk-skil">Skil</span>
      <span className="text-white">Vantage</span> Dashboard
    </>
  );
}
