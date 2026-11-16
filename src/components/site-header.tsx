"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { nav } from "@/lib/content";
import { cn } from "cn";

function active(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sv-nav">
      <div className="mx-auto flex h-16 items-center justify-between gap-3 px-3 sm:px-5">
        <Link href="/" aria-label="SkilVantage home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-5 lg:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active(pathname, item.href) ? "page" : undefined}
              className={cn(
                "text-sm text-muted-foreground hover:text-[#12a36a]",
                active(pathname, item.href) && "font-medium text-[#12a36a]",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/register" className="hidden h-10 items-center rounded-full bg-[#12a36a] px-4 text-sm text-white shadow-[0_8px_24px_rgb(18_163_106_/_0.35)] lg:inline-flex">
            Register Now
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="size-10 lg:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100%,22rem)] bg-paper">
              <SheetHeader>
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col px-4" aria-label="Mobile">
                {nav.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "border-b border-border py-3 text-base",
                        active(pathname, item.href) && "text-copper",
                      )}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto p-4">
                <SheetClose asChild>
                  <Link href="/register" className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#12a36a] text-base text-white">
                    Register Now
                  </Link>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
