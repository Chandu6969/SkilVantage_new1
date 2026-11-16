"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Briefcase,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Moon,
  Sun,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { SignOutButton } from "@/app/admin/(desk)/logout-button";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", icon: GraduationCap },
  { href: "/admin/professionals", label: "Professionals", icon: Briefcase },
  { href: "/admin/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/admin/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/admin/teacher", label: "Teacher", icon: UserRound },
  { href: "/admin/cash", label: "Cash & Bank", icon: Wallet },
  { href: "/admin/leads", label: "Registrations", icon: Users },
];

export function DeskShell({ role, children }: { role: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sv-desk-theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  function chooseTheme(next: "dark" | "light") {
    setTheme(next);
    localStorage.setItem("sv-desk-theme", next);
  }

  return (
    <div className="desk lg:grid lg:grid-cols-[240px_1fr]" data-theme={theme}>
      <aside className="flex flex-col border-b border-white/10 bg-[#101614] text-white lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r lg:border-white/10">
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/admin" className="flex items-center gap-2" aria-label="SkilVantage desk">
            <Spark />
            <span>
              <span className="block text-[1.05rem] font-semibold tracking-[0.12em]">
                <span className="desk-skil">SKIL</span>
                <span className="text-white">VANTAGE</span>
              </span>
              <span className="block text-[0.62rem] tracking-[0.22em] text-white/50">NEW BATCH</span>
            </span>
          </Link>
          <button type="button" className="rounded-lg border border-white/15 px-3 py-1 text-sm lg:hidden" onClick={() => setOpen((value) => !value)}>
            Menu
          </button>
        </div>
        <nav className={`${open ? "block" : "hidden"} space-y-1 px-3 pb-4 lg:block lg:flex-1`}>
          {links.map((link) => {
            const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${active ? "bg-[#14967c] text-white" : "text-white/75 hover:bg-white/5 hover:text-white"}`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-white/10 px-3 py-3">
          <div className="flex rounded-full bg-black/30 p-1 text-xs">
            <button type="button" className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${theme === "light" ? "bg-white text-[#10221c]" : "text-white/70"}`} onClick={() => chooseTheme("light")}>
              <Sun className="size-3.5" aria-hidden="true" /> Light
            </button>
            <button type="button" className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${theme === "dark" ? "bg-[#14967c] text-white" : "text-white/70"}`} onClick={() => chooseTheme("dark")}>
              <Moon className="size-3.5" aria-hidden="true" /> Dark
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-white/70">
            <Link href="/" className="hover:text-white">Public site</Link>
            <SignOutButton />
          </div>
          <p className="mt-1 text-[0.65rem] tracking-wide text-white/40 uppercase">{role === "admin" ? "Admin" : "Counsellor"}</p>
        </div>
      </aside>
      <div className="px-3 py-4 sm:px-5 sm:py-5 lg:px-6">
        <div className="mb-4 flex items-center justify-between text-xs text-[var(--desk-muted)] lg:hidden">
          <span>{role === "admin" ? "Admin" : "Counsellor"}</span>
          <span className="flex items-center gap-3"><Link href="/">Public site</Link><SignOutButton /></span>
        </div>
        {children}
      </div>
    </div>
  );
}

function Spark() {
  return (
    <svg viewBox="0 0 36 36" className="size-9" aria-hidden="true">
      <path d="M18 3l1.6 6.2L26 11l-6.4 1.8L18 19l-1.6-6.2L10 11l6.4-1.8L18 3z" fill="#7dffa8" />
      <path d="M28 16l.8 2.8L32 20l-3.2.9L28 24l-.8-3.1L24 20l3.2-1.2L28 16z" fill="#fff" />
      <path d="M8 20l.7 2.2L11 23l-2.3.7L8 26l-.7-2.3L5 23l2.3-.8L8 20z" fill="#b8ffd4" />
    </svg>
  );
}
