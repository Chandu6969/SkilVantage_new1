import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { getContact } from "@/lib/contact";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact SkilVantage",
  description: "Talk to SkilVantage about Data Analyst, Data Science, AI ML, Generative AI or Agentic AI training, or request career counselling.",
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ intent?: string }> }) {
  const params = await searchParams;
  const contact = getContact();
  const whatsappText = encodeURIComponent("Hello SkilVantage, I would like to talk about a career program.");
  return (
    <>
      <section className="sv-band">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-xs tracking-[0.16em] text-copper uppercase">Contact</p>
          <h1 className="mt-3 text-4xl sm:text-5xl">Talk to SkilVantage</h1>
          <p className="mt-4 max-w-2xl text-lg text-paper/75">Ask about a course, or request career counselling. The team replies on the phone or email you share.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          <article className="rounded-3xl border border-border p-5">
            <h2 className="text-xl text-ink">Email</h2>
            <a className="mt-1 block text-muted-foreground underline-offset-4 hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a>
          </article>
          <article className="rounded-3xl border border-border p-5">
            <h2 className="text-xl text-ink">Phone</h2>
            {contact.phone ? <a className="mt-1 block text-muted-foreground" href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a> : <p className="mt-1 text-muted-foreground">Request a call-back in the form and the career team will phone you.</p>}
          </article>
          <article className="rounded-3xl border border-border p-5">
            <h2 className="text-xl text-ink">WhatsApp</h2>
            {contact.whatsapp ? (
              <a className="mt-3 inline-flex h-11 items-center justify-center rounded-xl bg-teal px-4 text-white" href={`https://wa.me/${contact.whatsapp}?text=${whatsappText}`}>
                WhatsApp the career team
              </a>
            ) : (
              <a className="mt-3 inline-flex h-11 items-center justify-center rounded-xl bg-teal px-4 text-white" href="#contact-form">Request a WhatsApp conversation</a>
            )}
          </article>
          <article className="rounded-3xl border border-border p-5">
            <h2 className="text-xl text-ink">Location</h2>
            <p className="mt-1 text-muted-foreground">{contact.location}</p>
            <p className="mt-2 text-sm text-muted-foreground">{contact.locationDetail}</p>
          </article>
        </div>
        <ContactForm intent={params.intent} />
      </section>
    </>
  );
}
