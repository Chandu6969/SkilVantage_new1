import { redirect } from "next/navigation";
import { DeskShell } from "@/components/admin/desk-shell";
import { currentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SkilVantage desk",
  robots: { index: false, follow: false },
};

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  const session = await currentSession();
  if (!session) redirect("/admin/login");
  return <DeskShell role={session.role}>{children}</DeskShell>;
}
