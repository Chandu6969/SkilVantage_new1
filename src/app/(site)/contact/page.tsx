import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { getContact } from "@/lib/contact";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact SkilVantage",
  description: "Email, WhatsApp, or visit SkilVantage in Hyderabad, India. Ask about Data, AI, and career training.",
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ intent?: string }> }) {
  const params = await searchParams;
  const contact = getContact();
  const whatsappText = encodeURIComponent("Hello SkilVantage, I would like to talk about a career program.");
  const tel = contact.phone.replace(/[^\d+]/g, "");
  return (
    <>
      <section className="sv-band">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-xs tracking-[0.16em] text-white/75 uppercase">Contact</p>
          <h1 className="mt-3 text-4xl sm:text-5xl">Talk to SkilVantage</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">Write, message on WhatsApp, or ask for a call. The team is in Hyderabad, India.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          <article className="sv-band sv-color-card rounded-3xl p-5">
            <h2 className="text-xl text-white">Email</h2>
            <a className="mt-2 block text-lg text-white underline-offset-4 hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a>
          </article>
          <article className="sv-color-card rounded-3xl p-5 text-white" style={{ background: "linear-gradient(155deg, #115e59 0%, #0f766e 100%)" }}>
            <h2 className="text-xl">WhatsApp and phone</h2>
            <p className="mt-2 text-2xl">{contact.phone}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <a className="inline-flex h-11 items-center justify-center rounded-full bg-white px-4 text-sm text-[#0f766e]" href={`https://wa.me/${contact.whatsapp}?text=${whatsappText}`}>
                WhatsApp
              </a>
              <a className="inline-flex h-11 items-center justify-center rounded-full border border-white/70 px-4 text-sm text-white" href={`tel:${tel}`}>
                Call
              </a>
            </div>
          </article>
          <article className="sv-pros sv-color-card rounded-3xl p-5">
            <h2 className="text-xl">Address</h2>
            <p className="mt-2 text-2xl">{contact.location}</p>
            <p className="mt-2 text-sm text-white/80">{contact.locationDetail}</p>
          </article>
        </div>
        <ContactForm intent={params.intent} />
      </section>
    </>
  );
}
