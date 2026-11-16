import Link from "next/link";
import { Logo } from "@/components/logo";
import { brand, programs } from "@/lib/content";
import { getContact } from "@/lib/contact";

export function SiteFooter() {
  const contact = getContact();
  return (
    <footer className="border-t border-border sv-band">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo light />
          <p className="mt-4 text-sm leading-relaxed text-paper/75">{brand.tagline}</p>
          <p className="mt-4 text-sm text-paper/60">Job-readiness focused training. SkilVantage does not guarantee employment.</p>
        </div>
        <div>
          <p className="text-xs tracking-[0.16em] text-copper uppercase">Programs</p>
          <ul className="mt-3 space-y-2 text-sm text-paper/80">
            {programs.map((program) => (
              <li key={program.slug}>
                <Link href={`/programs/${program.slug}`} className="hover:text-paper">
                  {program.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-[0.16em] text-copper uppercase">Explore</p>
          <ul className="mt-3 space-y-2 text-sm text-paper/80">
            <li><Link href="/roadmaps" className="hover:text-paper">Career roadmaps</Link></li>
            <li><Link href="/projects" className="hover:text-paper">Projects</Link></li>
            <li><Link href="/job-ready" className="hover:text-paper">Job readiness</Link></li>
            <li><Link href="/about" className="hover:text-paper">About</Link></li>
            <li><Link href="/register?type=student" className="hover:text-paper">Student programs</Link></li>
            <li><Link href="/register?type=professional" className="hover:text-paper">Professional programs</Link></li>
            <li><Link href="/privacy" className="hover:text-paper">Privacy</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-[0.16em] text-copper uppercase">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-paper/80">
            <li><a href={`mailto:${contact.email}`} className="hover:text-paper">{contact.email}</a></li>
            <li>{contact.phone || "Request a call-back on the contact form"}</li>
            <li>{contact.location}</li>
            <li><Link href="/contact" className="hover:text-paper">Talk to a career advisor</Link></li>
            <li><Link href="/admin/login" className="text-paper/50 hover:text-paper">Career team desk</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-paper/50 sm:px-6">
          © {new Date().getFullYear()} SkilVantage. {brand.supporting}
        </p>
      </div>
    </footer>
  );
}
