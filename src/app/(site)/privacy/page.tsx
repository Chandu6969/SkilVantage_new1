import type { Metadata } from "next";
import { getContact } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How SkilVantage handles registration details, resumes, enquiries, and first-party analytics.",
};

export default function PrivacyPage() {
  const contact = getContact();
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs tracking-[0.16em] text-copper uppercase">Privacy</p>
      <h1 className="mt-3 text-4xl text-ink">Privacy policy</h1>
      <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
        <p>This page explains how SkilVantage handles information submitted through this website.</p>
        <p>Registration and contact forms collect the details you type, including your name, phone number, email, education or work background, and an optional resume. We use that information to review your interest, contact you about training, and keep counsellor notes and follow-up dates.</p>
        <p>An in-progress registration may stay in this browser tab until you submit it or close the tab. The saved registration is stored on the SkilVantage server. It is not kept only in your browser.</p>
        <p>If a private spreadsheet integration is enabled by the career team, a copy of the registration or enquiry is also written to that sheet for follow-up. Resumes are stored as files the career team can download. They are not shown on the public website.</p>
        <p>The site records first-party page views, course views, device type, and a random visitor id stored in your browser. This is used on the career-team desk to understand which programs are being read. It is not sold, and it is not sent to an advertising network.</p>
        <p>Access to registrations, notes, and resumes is limited to signed-in members of the career team. You can ask for a correction or deletion by emailing {contact.email}.</p>
        <p>Registration is a request for contact. It is not enrolment, and it is not consent to share your details with employers.</p>
      </div>
    </article>
  );
}
