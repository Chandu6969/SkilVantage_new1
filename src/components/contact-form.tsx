"use client";

import Link from "next/link";
import { useState } from "react";
import { useChallenge } from "@/components/use-challenge";
import { programs } from "@/lib/content";

export function ContactForm({ intent }: { intent?: string }) {
  const challenge = useChallenge();
  const [status, setStatus] = useState<"idle" | "saving" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const kind = intent === "counselling" ? "counselling" : intent === "course" ? "course" : "contact";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("saving");
    setError("");
    setFields({});
    const response = await fetch("/api/v1/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        phone: form.get("phone"),
        email: form.get("email"),
        course: form.get("course"),
        learnerType: form.get("learnerType"),
        message: form.get("message"),
        kind,
        consent: form.get("consent") === "on",
        challengeToken: challenge.token,
        challengeAnswer: challenge.answer,
        company_website: form.get("company_website"),
      }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string; fields?: Record<string, string> };
    if (!response.ok || !data.ok) {
      setStatus("error");
      setError(data.error || "The message could not be sent.");
      setFields(data.fields || {});
      if ((data.error || "").toLowerCase().includes("spam")) void challenge.refresh();
      return;
    }
    setStatus("sent");
    event.currentTarget.reset();
  }

  if (status === "sent") {
    return (
      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="text-2xl text-ink">The career team has your message.</h2>
        <p className="mt-2 text-muted-foreground">Someone will reply on the phone number or email you shared. If you already know the program, you can register while you wait.</p>
        <Link href="/register" className="mt-5 inline-flex h-12 items-center justify-center rounded-xl bg-ink px-5 text-paper">Register Now</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6" id="contact-form">
      <h2 className="text-2xl text-ink">{kind === "counselling" ? "Request career counselling" : kind === "course" ? "Course enquiry" : "Talk to SkilVantage"}</h2>
      <label className="field">Name<input name="name" autoComplete="name" required /></label>
      {fields.name ? <p className="text-sm text-destructive">{fields.name}</p> : null}
      <label className="field">Phone<input name="phone" autoComplete="tel" inputMode="tel" required /></label>
      {fields.phone ? <p className="text-sm text-destructive">{fields.phone}</p> : null}
      <label className="field">Email<input name="email" autoComplete="email" inputMode="email" required /></label>
      {fields.email ? <p className="text-sm text-destructive">{fields.email}</p> : null}
      <label className="field">Interested Course
        <select name="course" defaultValue={kind === "counselling" ? "not-sure" : "data-analyst"}>
          {programs.map((program) => <option key={program.slug} value={program.slug}>{program.name}</option>)}
          <option value="not-sure">Not sure yet</option>
        </select>
      </label>
      <label className="field">Learner Type
        <select name="learnerType" defaultValue="not-sure">
          <option value="student">Student / Fresher</option>
          <option value="professional">Working Professional</option>
          <option value="not-sure">Not sure yet</option>
        </select>
      </label>
      <label className="field">Message<textarea name="message" required minLength={10} placeholder={kind === "counselling" ? "Tell us what you want to change in your career. Ask for WhatsApp if you prefer it." : "What would you like to ask?"} /></label>
      {fields.message ? <p className="text-sm text-destructive">{fields.message}</p> : null}
      <label className="field">{challenge.question || "Spam check"}<input name="challenge" inputMode="numeric" value={challenge.answer} onChange={(event) => challenge.setAnswer(event.target.value)} required /></label>
      {challenge.error ? <p className="text-sm text-destructive">{challenge.error}</p> : null}
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" className="mt-1 size-4 accent-ink" required />
        <span>I agree to the SkilVantage <Link href="/privacy" className="underline">privacy policy</Link> and allow SkilVantage to contact me regarding training programs and career opportunities.</span>
      </label>
      <div className="absolute -left-[9999px] h-0 overflow-hidden" aria-hidden="true">
        <label>Company website<input name="company_website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      <button type="submit" disabled={status === "saving"} className="h-12 rounded-xl bg-copper text-white disabled:opacity-60">
        {status === "saving" ? "Sending…" : "Talk to SkilVantage"}
      </button>
    </form>
  );
}
