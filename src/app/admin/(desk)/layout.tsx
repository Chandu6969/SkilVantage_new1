import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/app/admin/(desk)/logout-button";
import { Logo } from "@/components/logo";
import { currentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Career team desk",
  robots: { index: false, follow: false },
};

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  const session = await currentSession();
  if (!session) redirect("/admin/login");
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="border-b border-white/10 bg-ink text-paper lg:min-h-screen lg:border-b-0">
        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:block">
          <Link href="/admin" aria-label="Desk home"><Logo light /></Link>
          <p className="text-xs text-paper/60 lg:mt-3">{session.role === "admin" ? "Admin" : "Counsellor"}</p>
        </div>
        <nav className="flex gap-4 overflow-x-auto px-4 pb-4 text-sm lg:block lg:space-y-2 lg:px-4">
          <Link className="block whitespace-nowrap text-paper/80 hover:text-paper" href="/admin">Overview</Link>
          <Link className="block whitespace-nowrap text-paper/80 hover:text-paper" href="/admin/leads">Registrations</Link>
          <Link className="block whitespace-nowrap text-paper/80 hover:text-paper" href="/admin/enquiries">Enquiries</Link>
          <Link className="block whitespace-nowrap text-paper/50 hover:text-paper" href="/">Public site</Link>
          <SignOutButton />
        </nav>
      </aside>
      <div className="px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}
