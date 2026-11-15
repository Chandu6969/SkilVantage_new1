import { z } from "zod";
import {
  AVAILABILITY,
  BATCH_TIMINGS,
  CURRENT_YEARS,
  EXPERIENCE_BANDS,
  GENDERS,
  HEARD_FROM,
  INDIAN_STATES,
  LEARNING_MODES,
  NOTICE_PERIODS,
  OPPORTUNITIES,
  PASSED_OUT_YEARS,
  TARGET_TRACKS,
} from "@/lib/india";
import { LEAD_STATUSES, PROGRAM_SLUGS } from "@/lib/types";

const required = (label: string) =>
  z.string().trim().min(2, `Enter ${label}.`).max(160, `${label} is too long.`);

const longText = (label: string, max = 2000) =>
  z.string().trim().min(2, `Enter ${label}.`).max(max, `${label} is too long.`);

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .default("")
  .refine((value) => value === "" || /^https?:\/\/\S+$/i.test(value), {
    error: "Enter a full link starting with https://",
  });

export const phoneField = z
  .string()
  .trim()
  .max(20)
  .regex(/^\+?[0-9][0-9\s-]{7,18}$/, "Enter a valid phone number.");

export const emailField = z
  .string()
  .trim()
  .max(120)
  .email("Enter a valid email address.")
  .transform((value) => value.toLowerCase());

const programField = z.enum(PROGRAM_SLUGS, { error: "Select a program." });

const personal = {
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(80, "Use 80 characters or fewer.")
    .regex(/^[\p{L}][\p{L}\s.'-]{1,79}$/u, "Use letters in your name."),
  phone: phoneField,
  email: emailField,
  city: required("your city"),
  state: z.enum(INDIAN_STATES, { error: "Select a state." }),
};

export const studentSchema = z.object({
  learnerType: z.literal("student"),
  program: programField,
  ...personal,
  gender: z.enum(GENDERS, { error: "Select a gender option." }),
  college: required("your college or university"),
  degree: required("your degree"),
  branch: required("your branch or specialization"),
  passedOutYear: z.enum(PASSED_OUT_YEARS, { error: "Select a passed-out year." }),
  currentYear: z.enum(CURRENT_YEARS, { error: "Select your current year of study." }),
  skills: longText("your current skill set"),
  programmingLanguages: required("the languages you know, or None yet"),
  tools: required("the tools you know, or None yet"),
  projects: longText("your previous projects, or None yet"),
  certifications: longText("your certifications, or None"),
  preferredTrack: programField,
  expectedPackage: required("your expected salary, or Not sure yet"),
  preferredRole: required("your preferred job role"),
  opportunity: z.enum(OPPORTUNITIES, { error: "Select internship, job, or both." }),
  learningMode: z.enum(LEARNING_MODES, { error: "Select a learning mode." }),
  availability: z.enum(AVAILABILITY, { error: "Select your availability." }),
  source: z.enum(HEARD_FROM, { error: "Tell us how you heard about SkilVantage." }),
  linkedin: optionalUrl,
  github: optionalUrl,
  consent: z.literal(true, { error: "Consent is required before we can contact you." }),
});

export const professionalSchema = z.object({
  learnerType: z.literal("professional"),
  program: programField,
  ...personal,
  company: required("your current company, or write Independent"),
  currentRole: required("your current job role"),
  experience: z.enum(EXPERIENCE_BANDS, { error: "Select your experience." }),
  industry: required("your current industry"),
  currentSkills: longText("your current technology or skill set"),
  previousExperience: longText("a short note on your previous experience"),
  targetTrack: z.enum(TARGET_TRACKS, { error: "Select a target career track." }),
  targetRole: required("your target job role"),
  careerChangeReason: longText("why you want this change", 2000),
  expectedPackage: required("your expected salary, or Not sure yet"),
  currentPackage: required("your current salary, or Prefer not to say"),
  noticePeriod: z.enum(NOTICE_PERIODS, { error: "Select a notice period." }),
  learningMode: z.enum(LEARNING_MODES, { error: "Select a learning mode." }),
  batchTiming: z.enum(BATCH_TIMINGS, { error: "Select a batch timing." }),
  source: z.enum(HEARD_FROM, { error: "Tell us how you heard about SkilVantage." }),
  linkedin: optionalUrl,
  github: optionalUrl,
  consent: z.literal(true, { error: "Consent is required before we can contact you." }),
});

export const enquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your name.")
    .max(80)
    .regex(/^[\p{L}][\p{L}\s.'-]{1,79}$/u, "Use letters in your name."),
  phone: phoneField,
  email: emailField,
  course: z.enum([...PROGRAM_SLUGS, "not-sure"], { error: "Select a course." }),
  learnerType: z.enum(["student", "professional", "not-sure"], {
    error: "Select a learner type.",
  }),
  message: z.string().trim().min(10, "Add a short message.").max(2000),
  kind: z.enum(["contact", "counselling", "course"]),
  consent: z.literal(true, { error: "Consent is required before we can contact you." }),
});

export const leadPatchSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  counsellorNotes: z.string().trim().max(4000).optional(),
  followUpDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date.")
    .nullable()
    .optional(),
  counsellor: z.string().trim().max(80).optional(),
  followUpNotes: z.string().trim().max(2000).optional(),
});

export const analyticsSchema = z.object({
  path: z.string().trim().min(1).max(200),
  device: z.enum(["mobile", "tablet", "desktop", "unknown"]).default("unknown"),
  course: z.string().trim().max(80).nullable().optional(),
  learnerType: z.enum(["student", "professional"]).nullable().optional(),
  eventType: z
    .enum(["page_view", "course_view", "learner_choice"])
    .default("page_view"),
  source: z.string().trim().max(80).nullable().optional(),
  visitorId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]{8,64}$/)
    .nullable()
    .optional(),
});

export type StudentInput = z.infer<typeof studentSchema>;
export type ProfessionalInput = z.infer<typeof professionalSchema>;
export type EnquiryInput = z.infer<typeof enquirySchema>;

export function zodFieldErrors(error: z.ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

export function parseRegistration(input: unknown) {
  const learnerType =
    typeof input === "object" && input && "learnerType" in input
      ? (input as { learnerType?: unknown }).learnerType
      : undefined;
  const schema =
    learnerType === "professional"
      ? professionalSchema
      : learnerType === "student"
        ? studentSchema
        : null;
  if (!schema) {
    return {
      ok: false as const,
      error: "Select a learner type.",
      fields: { learnerType: "Select a learner type." },
    };
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Check the highlighted fields.",
      fields: zodFieldErrors(parsed.error),
    };
  }
  return { ok: true as const, data: parsed.data };
}
