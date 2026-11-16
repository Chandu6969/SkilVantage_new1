"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useChallenge } from "@/components/use-challenge";
import { getProgram, professionalAudience, programs, studentAudience, trackLabel } from "@/lib/content";
import { programGradient } from "@/lib/palette";
import {
  AVAILABILITY,
  BATCH_TIMINGS,
  BRANCHES,
  CURRENT_YEARS,
  DEGREES,
  EXPERIENCE_BANDS,
  GENDERS,
  HEARD_FROM,
  INDIAN_STATES,
  LANGUAGES,
  LEARNING_MODES,
  NOTICE_PERIODS,
  OPPORTUNITIES,
  PASSED_OUT_YEARS,
  TARGET_TRACKS,
  TOOL_OPTIONS,
} from "@/lib/india";
import { PROGRAM_SLUGS, type ProgramSlug } from "@/lib/types";
import { parseRegistration } from "@/lib/validation";

const DRAFT_KEY = "sv-register-draft";

type Draft = {
  learnerType: "" | "student" | "professional";
  program: "" | ProgramSlug;
  fullName: string;
  gender: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  college: string;
  degree: string;
  branch: string;
  passedOutYear: string;
  currentYear: string;
  skills: string;
  programmingLanguages: string;
  tools: string;
  projects: string;
  certifications: string;
  preferredTrack: string;
  expectedPackage: string;
  preferredRole: string;
  opportunity: string;
  learningMode: string;
  availability: string;
  source: string;
  linkedin: string;
  github: string;
  company: string;
  currentRole: string;
  experience: string;
  industry: string;
  currentSkills: string;
  previousExperience: string;
  targetTrack: string;
  targetRole: string;
  careerChangeReason: string;
  currentPackage: string;
  noticePeriod: string;
  batchTiming: string;
  consent: boolean;
  company_website: string;
};

const empty = (): Draft => ({
  learnerType: "",
  program: "",
  fullName: "",
  gender: "",
  phone: "",
  email: "",
  city: "",
  state: "",
  college: "",
  degree: "",
  branch: "",
  passedOutYear: "",
  currentYear: "",
  skills: "",
  programmingLanguages: "",
  tools: "",
  projects: "",
  certifications: "",
  preferredTrack: "",
  expectedPackage: "",
  preferredRole: "",
  opportunity: "",
  learningMode: "",
  availability: "",
  source: "",
  linkedin: "",
  github: "",
  company: "",
  currentRole: "",
  experience: "",
  industry: "",
  currentSkills: "",
  previousExperience: "",
  targetTrack: "",
  targetRole: "",
  careerChangeReason: "",
  currentPackage: "",
  noticePeriod: "",
  batchTiming: "",
  consent: false,
  company_website: "",
});

function isProgram(value: string): value is ProgramSlug {
  return (PROGRAM_SLUGS as readonly string[]).includes(value);
}

function toggleChip(current: string, value: string) {
  const items = current.split(",").map((item) => item.trim()).filter(Boolean);
  if (value === "None yet") return items.includes("None yet") ? "" : "None yet";
  const next = items.filter((item) => item !== "None yet");
  return (next.includes(value) ? next.filter((item) => item !== value) : [...next, value]).join(", ");
}

export function RegisterWizard({
  initialType,
  initialProgram,
  focus,
}: {
  initialType?: string;
  initialProgram?: string;
  focus?: string;
}) {
  const router = useRouter();
  const challenge = useChallenge();
  const [draft, setDraft] = useState<Draft>(() => {
    const next = empty();
    if (initialType === "student" || initialType === "professional") next.learnerType = initialType;
    if (initialProgram && isProgram(initialProgram)) {
      next.program = initialProgram;
      next.preferredTrack = initialProgram;
      const label = trackLabel[initialProgram];
      next.targetTrack = label;
      next.preferredRole = getProgram(initialProgram)?.roles[0] || "";
      next.targetRole = next.preferredRole;
    }
    return next;
  });
  const [step, setStep] = useState(() => (draft.learnerType && draft.program ? 2 : draft.learnerType ? 1 : 0));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resume, setResume] = useState<File | null>(null);

  useEffect(() => {
    if (initialType || initialProgram) return;
    const saved = sessionStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as Partial<Draft>;
      setDraft((current) => ({ ...current, ...parsed, consent: false, company_website: "" }));
      if (typeof parsed.learnerType === "string" && parsed.program) setStep(2);
    } catch {
      sessionStorage.removeItem(DRAFT_KEY);
    }
  }, [initialProgram, initialType]);

  useEffect(() => {
    const rest: Partial<Draft> = { ...draft };
    delete rest.company_website;
    delete rest.consent;
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
  }, [draft]);

  const program = draft.program ? getProgram(draft.program) : null;
  const roles = program?.roles || [];

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const stepFields = useMemo(() => {
    if (step === 2) return ["fullName", "gender", "phone", "email", "city", "state"];
    if (step === 3) {
      return draft.learnerType === "professional"
        ? ["company", "currentRole", "experience", "industry", "currentSkills", "previousExperience"]
        : ["college", "degree", "branch", "passedOutYear", "currentYear"];
    }
    if (step === 4) {
      return draft.learnerType === "professional"
        ? ["targetTrack", "targetRole", "careerChangeReason", "currentPackage", "expectedPackage", "noticePeriod"]
        : ["skills", "programmingLanguages", "tools", "projects", "certifications"];
    }
    if (step === 5) {
      return draft.learnerType === "professional"
        ? ["learningMode", "batchTiming", "source", "linkedin", "github", "consent"]
        : ["preferredTrack", "expectedPackage", "preferredRole", "opportunity", "learningMode", "availability", "source", "linkedin", "github", "consent"];
    }
    return [];
  }, [draft.learnerType, step]);

  function validate(currentStep = step) {
    if (currentStep === 0 && !draft.learnerType) {
      setErrors({ learnerType: "Select a learner type." });
      return false;
    }
    if (currentStep === 1 && !draft.program) {
      setErrors({ program: "Select a program." });
      return false;
    }
    if (currentStep < 2) {
      setErrors({});
      return true;
    }
    const payload = { ...draft, consent: currentStep === 5 ? draft.consent : true };
    const parsed = parseRegistration(payload);
    if (parsed.ok) {
      setErrors({});
      return true;
    }
    const relevant = Object.fromEntries(Object.entries(parsed.fields).filter(([key]) => stepFields.includes(key) || (currentStep === 5 && key === "consent")));
    const active = currentStep === 5 ? Object.fromEntries(Object.entries(parsed.fields).filter(([key]) => stepFields.includes(key))) : relevant;
    if (Object.keys(active).length) {
      setErrors(active);
      return false;
    }
    setErrors({});
    return true;
  }

  function next() {
    if (!validate()) return;
    setFormError("");
    setStep((current) => Math.min(5, current + 1));
  }

  async function submit() {
    if (!validate(5)) return;
    if (!challenge.token) {
      setFormError("The spam check is not ready yet.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    const { company_website, ...fields } = draft;
    const form = new FormData();
    form.set("payload", JSON.stringify({ ...fields, consent: true }));
    form.set("challengeToken", challenge.token);
    form.set("challengeAnswer", challenge.answer);
    form.set("company_website", company_website);
    if (resume) form.set("resume", resume);
    try {
      const response = await fetch("/api/v1/registrations", { method: "POST", body: form });
      const data = (await response.json()) as { ok?: boolean; id?: string; error?: string; fields?: Record<string, string>; duplicate?: boolean };
      if (!response.ok || !data.ok || !data.id) {
        setErrors(data.fields || {});
        setFormError(data.error || "The registration could not be saved.");
        if (data.error?.toLowerCase().includes("spam")) void challenge.refresh();
        setSubmitting(false);
        return;
      }
      sessionStorage.removeItem(DRAFT_KEY);
      router.push(`/register/success?id=${encodeURIComponent(data.id)}${data.duplicate ? "&duplicate=1" : ""}`);
    } catch {
      setFormError("We could not reach SkilVantage. Check your connection and try again. Your details are still on this page.");
      setSubmitting(false);
    }
  }

  const cheers = [
    "Two doors. Pick the one that fits today.",
    "Five careers. One of them can be yours.",
    "Just the details a person would ask over coffee.",
    draft.learnerType === "professional" ? "Where you work now, in your own words." : "Your college story, kept short.",
    draft.learnerType === "professional" ? "The move you want to make." : "What you already know. None yet is a fine answer.",
    "Last step. Then the career team takes it from here.",
  ];

  return (
    <div className="sv-card mx-auto max-w-3xl rounded-[2rem] px-4 py-10 sm:px-8 sm:py-14">
      <p className="sv-kicker">Registration</p>
      <h1 className="mt-2 text-4xl text-ink">Tell us where you are, and where you want to go.</h1>
      <p className="mt-3 text-lg text-[#12a36a]">{cheers[step]}</p>
      <p className="mt-2 text-muted-foreground">This takes a few minutes on a phone. A counsellor reviews it before anyone is enrolled.</p>
      {focus === "communication" ? (
        <p className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-sm">Communication training is part of every program. Choose the career path you want, and mention communication in counselling.</p>
      ) : null}
      <div className="mt-6 flex gap-1" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} className={`h-1.5 flex-1 rounded-full transition-colors ${index <= step ? "bg-[#12a36a]" : "bg-white/80"}`} />
        ))}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Step {step + 1} of 6</p>

      {step >= 2 && draft.learnerType && program ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm">
          <p>{draft.learnerType === "student" ? "Student / Fresher" : "Working Professional"} · {program.name}</p>
          <button type="button" className="underline-offset-4 hover:underline" onClick={() => setStep(0)}>Change</button>
        </div>
      ) : null}

      <div key={step} className="sv-step mt-6">
        {step === 0 ? (
          <fieldset>
            <legend className="text-2xl text-ink">Select Your Learner Type</legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Choice tone="student" checked={draft.learnerType === "student"} onChange={() => { update("learnerType", "student"); void fetch("/api/v1/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "/register", eventType: "learner_choice", learnerType: "student", device: window.innerWidth < 768 ? "mobile" : "desktop" }) }).catch(() => undefined); }} title="Student / Fresher" points={studentAudience} />
              <Choice tone="professional" checked={draft.learnerType === "professional"} onChange={() => { update("learnerType", "professional"); void fetch("/api/v1/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "/register", eventType: "learner_choice", learnerType: "professional", device: window.innerWidth < 768 ? "mobile" : "desktop" }) }).catch(() => undefined); }} title="Working Professional" points={professionalAudience} />
            </div>
            {errors.learnerType ? <p className="mt-2 text-sm text-destructive">{errors.learnerType}</p> : null}
          </fieldset>
        ) : null}

        {step === 1 ? (
          <fieldset>
            <legend className="text-2xl text-ink">Select Your Program</legend>
            <div className="mt-4 grid gap-3">
              {programs.map((item) => (
                <label key={item.slug} className={`sv-color-card cursor-pointer rounded-2xl p-4 text-white ${draft.program === item.slug ? "ring-4 ring-white" : ""}`} style={{ background: programGradient(item.slug) }}>
                  <input className="sr-only" type="radio" name="program" checked={draft.program === item.slug} onChange={() => setDraft((current) => ({ ...current, program: item.slug, preferredTrack: item.slug, targetTrack: trackLabel[item.slug], preferredRole: item.roles[0] || "", targetRole: item.roles[0] || "" }))} />
                  <span className="block text-lg">{item.name}</span>
                  <span className="mt-1 block text-sm text-white/85">{item.description}</span>
                </label>
              ))}
            </div>
            {errors.program ? <p className="mt-2 text-sm text-destructive">{errors.program}</p> : null}
          </fieldset>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4">
            <h2 className="text-2xl text-ink">Personal Information</h2>
            <Field label="Full Name" error={errors.fullName}><input autoComplete="name" value={draft.fullName} onChange={(event) => update("fullName", event.target.value)} /></Field>
            {draft.learnerType === "student" ? (
              <Field label="Gender" error={errors.gender}>
                <select value={draft.gender} onChange={(event) => update("gender", event.target.value)}>
                  <option value="">Select</option>
                  {GENDERS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
            ) : null}
            <Field label="Phone Number" error={errors.phone}><input autoComplete="tel" inputMode="tel" value={draft.phone} onChange={(event) => update("phone", event.target.value)} /></Field>
            <Field label="Email Address" error={errors.email}><input autoComplete="email" inputMode="email" value={draft.email} onChange={(event) => update("email", event.target.value)} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City" error={errors.city}><input autoComplete="address-level2" value={draft.city} onChange={(event) => update("city", event.target.value)} /></Field>
              <Field label="State" error={errors.state}>
                <select autoComplete="address-level1" value={draft.state} onChange={(event) => update("state", event.target.value)}>
                  <option value="">Select</option>
                  {INDIAN_STATES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
            </div>
          </div>
        ) : null}

        {step === 3 && draft.learnerType === "student" ? (
          <div className="grid gap-4">
            <h2 className="text-2xl text-ink">Academic Information</h2>
            <Field label="College / University Name" error={errors.college}><input value={draft.college} onChange={(event) => update("college", event.target.value)} /></Field>
            <Field label="Degree" error={errors.degree}><input list="degrees" value={draft.degree} onChange={(event) => update("degree", event.target.value)} /><datalist id="degrees">{DEGREES.map((item) => <option key={item} value={item} />)}</datalist></Field>
            <Field label="Branch / Specialization" error={errors.branch}><input list="branches" value={draft.branch} onChange={(event) => update("branch", event.target.value)} /><datalist id="branches">{BRANCHES.map((item) => <option key={item} value={item} />)}</datalist></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Passed Out Year" error={errors.passedOutYear}>
                <select value={draft.passedOutYear} onChange={(event) => update("passedOutYear", event.target.value)}><option value="">Select</option>{PASSED_OUT_YEARS.map((item) => <option key={item}>{item}</option>)}</select>
              </Field>
              <Field label="Current Year of Study" error={errors.currentYear}>
                <select value={draft.currentYear} onChange={(event) => update("currentYear", event.target.value)}><option value="">Select</option>{CURRENT_YEARS.map((item) => <option key={item}>{item}</option>)}</select>
              </Field>
            </div>
          </div>
        ) : null}

        {step === 3 && draft.learnerType === "professional" ? (
          <div className="grid gap-4">
            <h2 className="text-2xl text-ink">Professional Information</h2>
            <Field label="Current Company" error={errors.company} hint="Write Independent if you are not with a company."><input value={draft.company} onChange={(event) => update("company", event.target.value)} /></Field>
            <Field label="Current Job Role" error={errors.currentRole}><input value={draft.currentRole} onChange={(event) => update("currentRole", event.target.value)} /></Field>
            <Field label="Total Years of Experience" error={errors.experience}><select value={draft.experience} onChange={(event) => update("experience", event.target.value)}><option value="">Select</option>{EXPERIENCE_BANDS.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Current Industry" error={errors.industry}><input value={draft.industry} onChange={(event) => update("industry", event.target.value)} /></Field>
            <Field label="Current Technology / Skill Set" error={errors.currentSkills}><textarea value={draft.currentSkills} onChange={(event) => update("currentSkills", event.target.value)} /></Field>
            <Field label="Previous Experience" error={errors.previousExperience}><textarea value={draft.previousExperience} onChange={(event) => update("previousExperience", event.target.value)} /></Field>
          </div>
        ) : null}

        {step === 4 && draft.learnerType === "student" ? (
          <div className="grid gap-4">
            <h2 className="text-2xl text-ink">Technical Information</h2>
            <Field label="Current Skill Set" error={errors.skills}><textarea value={draft.skills} onChange={(event) => update("skills", event.target.value)} /></Field>
            <Chips label="Programming Languages Known" error={errors.programmingLanguages} options={LANGUAGES} value={draft.programmingLanguages} onChange={(value) => update("programmingLanguages", value)} />
            <Chips label="Tools / Technologies Known" error={errors.tools} options={TOOL_OPTIONS} value={draft.tools} onChange={(value) => update("tools", value)} />
            <Field label="Previous Projects" error={errors.projects} hint="Write None yet if this is your first project."><textarea value={draft.projects} onChange={(event) => update("projects", event.target.value)} /></Field>
            <Field label="Certifications" error={errors.certifications} hint="Write None if you do not have any."><textarea value={draft.certifications} onChange={(event) => update("certifications", event.target.value)} /></Field>
          </div>
        ) : null}

        {step === 4 && draft.learnerType === "professional" ? (
          <div className="grid gap-4">
            <h2 className="text-2xl text-ink">Career Transition</h2>
            <Field label="Target Career Track" error={errors.targetTrack}><select value={draft.targetTrack} onChange={(event) => update("targetTrack", event.target.value)}><option value="">Select</option>{TARGET_TRACKS.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Target Job Role" error={errors.targetRole}><input list="roles" value={draft.targetRole} onChange={(event) => update("targetRole", event.target.value)} /><datalist id="roles">{roles.map((role) => <option key={role} value={role} />)}</datalist></Field>
            <Field label="Reason for Career Change" error={errors.careerChangeReason}><textarea value={draft.careerChangeReason} onChange={(event) => update("careerChangeReason", event.target.value)} /></Field>
            <Field label="Current Salary / Package" error={errors.currentPackage} hint="Your figure, or Prefer not to say. It is not shared publicly."><input value={draft.currentPackage} onChange={(event) => update("currentPackage", event.target.value)} /></Field>
            <Field label="Expected Salary / Package" error={errors.expectedPackage} hint="Your expectation, not a promise from SkilVantage."><input value={draft.expectedPackage} onChange={(event) => update("expectedPackage", event.target.value)} /></Field>
            <Field label="Notice Period" error={errors.noticePeriod}><select value={draft.noticePeriod} onChange={(event) => update("noticePeriod", event.target.value)}><option value="">Select</option>{NOTICE_PERIODS.map((item) => <option key={item}>{item}</option>)}</select></Field>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="grid gap-4">
            <h2 className="text-2xl text-ink">{draft.learnerType === "student" ? "Career Information" : "Learning preferences"}</h2>
            {draft.learnerType === "student" ? (
              <>
                <Field label="Preferred Career Track" error={errors.preferredTrack}>
                  <select value={draft.preferredTrack} onChange={(event) => update("preferredTrack", event.target.value)}>
                    <option value="">Select</option>
                    {programs.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
                  </select>
                </Field>
                <Field label="Expected Salary / Package" error={errors.expectedPackage} hint="Your expectation, or Not sure yet. Not a promise from SkilVantage."><input value={draft.expectedPackage} onChange={(event) => update("expectedPackage", event.target.value)} /></Field>
                <Field label="Preferred Job Role" error={errors.preferredRole}><input list="student-roles" value={draft.preferredRole} onChange={(event) => update("preferredRole", event.target.value)} /><datalist id="student-roles">{roles.map((role) => <option key={role} value={role} />)}</datalist></Field>
                <Field label="Are you looking for an internship, a job, or both?" error={errors.opportunity}><select value={draft.opportunity} onChange={(event) => update("opportunity", event.target.value)}><option value="">Select</option>{OPPORTUNITIES.map((item) => <option key={item}>{item}</option>)}</select></Field>
                <Field label="Availability" error={errors.availability}><select value={draft.availability} onChange={(event) => update("availability", event.target.value)}><option value="">Select</option>{AVAILABILITY.map((item) => <option key={item}>{item}</option>)}</select></Field>
              </>
            ) : (
              <Field label="Preferred Batch Timing" error={errors.batchTiming}><select value={draft.batchTiming} onChange={(event) => update("batchTiming", event.target.value)}><option value="">Select</option>{BATCH_TIMINGS.map((item) => <option key={item}>{item}</option>)}</select></Field>
            )}
            <Field label="Preferred Learning Mode" error={errors.learningMode}>
              <select value={draft.learningMode} onChange={(event) => update("learningMode", event.target.value)}><option value="">Select</option>{LEARNING_MODES.map((item) => <option key={item}>{item}</option>)}</select>
            </Field>
            <Field label="How did you hear about SkilVantage?" error={errors.source}><select value={draft.source} onChange={(event) => update("source", event.target.value)}><option value="">Select</option>{HEARD_FROM.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="LinkedIn Profile" error={errors.linkedin} hint="Optional. Include https://"><input value={draft.linkedin} onChange={(event) => update("linkedin", event.target.value)} /></Field>
            <Field label="GitHub Profile" error={errors.github} hint="Optional. Include https://"><input value={draft.github} onChange={(event) => update("github", event.target.value)} /></Field>
            <Field label="Resume Upload" hint="Optional. PDF, DOC, or DOCX, up to 5 MB.">
              <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setResume(event.target.files?.[0] || null)} />
            </Field>
            <Field label={challenge.question || "Spam check"} error={challenge.error}>
              <input inputMode="numeric" value={challenge.answer} onChange={(event) => challenge.setAnswer(event.target.value)} />
            </Field>
            <label className="flex items-start gap-3 text-sm leading-relaxed">
              <input type="checkbox" className="mt-1 size-4 accent-ink" checked={draft.consent} onChange={(event) => update("consent", event.target.checked)} />
              <span>I agree to the SkilVantage <Link href="/privacy" className="underline">privacy policy</Link> and allow SkilVantage to contact me regarding training programs and career opportunities.</span>
            </label>
            {errors.consent ? <p className="text-sm text-destructive">{errors.consent}</p> : null}
            <div className="absolute -left-[9999px] h-0 overflow-hidden" aria-hidden="true">
              <label>Company website<input tabIndex={-1} autoComplete="off" value={draft.company_website} onChange={(event) => update("company_website", event.target.value)} /></label>
            </div>
          </div>
        ) : null}
      </div>

      {formError ? <p className="mt-4 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">{formError}</p> : null}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {step > 0 ? (
          <button type="button" className="h-12 rounded-xl border border-border px-5" onClick={() => { setErrors({}); setStep((current) => current - 1); }}>Back</button>
        ) : <span />}
        {step < 5 ? (
          <button type="button" className="h-12 rounded-full bg-[#12a36a] px-5 text-white" onClick={next}>Continue</button>
        ) : (
          <button type="button" disabled={submitting} className="h-12 rounded-full bg-[#0c3b28] px-5 text-white disabled:opacity-60" onClick={() => void submit()}>
            {submitting ? "Saving…" : draft.learnerType === "professional" ? "Plan My Career Transition" : "Start My Career Journey"}
          </button>
        )}
      </div>
    </div>
  );
}

function Choice({ checked, onChange, title, points, tone }: { checked: boolean; onChange: () => void; title: string; points: string[]; tone: "student" | "professional" }) {
  return (
    <label className={`sv-color-card cursor-pointer rounded-3xl p-5 text-white ${tone === "student" ? "sv-band" : "sv-pros"} ${checked ? "ring-4 ring-white" : ""}`}>
      <input className="sr-only" type="radio" name="learnerType" checked={checked} onChange={onChange} />
      <span className="block text-xl">{title}</span>
      <span className="mt-3 block space-y-1 text-sm text-white/85">{points.map((point) => <span key={point} className="block">{point}</span>)}</span>
    </label>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="field block">
      <span className="text-sm font-medium text-ink">{label}</span>
      {hint ? <span className="mt-1 block text-sm text-muted-foreground">{hint}</span> : null}
      {children}
      {error ? <span className="mt-1 block text-sm text-destructive">{error}</span> : null}
    </label>
  );
}

function Chips({ label, options, value, onChange, error }: { label: string; options: readonly string[]; value: string; onChange: (value: string) => void; error?: string }) {
  const selected = value.split(",").map((item) => item.trim());
  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button key={option} type="button" onClick={() => onChange(toggleChip(value, option))} className={`rounded-full border px-3 py-2 text-sm transition ${selected.includes(option) ? "border-[#12a36a] bg-[#12a36a] text-white" : "border-white/80 bg-white/70"}`}>
            {option}
          </button>
        ))}
      </div>
      {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
    </fieldset>
  );
}
