export const PROGRAM_SLUGS = [
  "data-analyst",
  "data-scientist",
  "ai-ml",
  "generative-ai",
  "agentic-ai",
] as const;

export type ProgramSlug = (typeof PROGRAM_SLUGS)[number];

export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Counselling Scheduled",
  "Interested",
  "Registered",
  "Training Started",
  "Completed",
  "Not Interested",
  "Follow-up Required",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type LearnerType = "student" | "professional";

export type PhaseId =
  | "foundation"
  | "core"
  | "advanced"
  | "projects"
  | "portfolio"
  | "resume"
  | "interview"
  | "job-ready";

export interface Registration {
  id: string;
  createdAt: string;
  learnerType: LearnerType;
  program: ProgramSlug;
  status: LeadStatus;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  gender: string;
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
  counsellorNotes: string;
  followUpDate: string | null;
  resumeFileId: string | null;
  resumeName: string | null;
  sheetsSynced: boolean;
  sample: boolean;
  consentAt: string;
}

export interface Enquiry {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  email: string;
  course: string;
  learnerType: string;
  message: string;
  kind: "contact" | "counselling" | "course";
  status: LeadStatus;
  notes: string;
  sample: boolean;
  sheetsSynced: boolean;
}

export interface FollowUp {
  id: string;
  registrationId: string;
  name: string;
  phone: string;
  course: string;
  followUpDate: string;
  counsellor: string;
  status: string;
  notes: string;
  createdAt: string;
  sheetsSynced: boolean;
}

export interface AnalyticsEvent {
  id: string;
  createdAt: string;
  eventType: "page_view" | "course_view" | "registration" | "enquiry" | "learner_choice";
  path: string;
  course: string | null;
  learnerType: string | null;
  device: "mobile" | "tablet" | "desktop" | "unknown";
  source: string | null;
  visitorId: string | null;
  sample: boolean;
}

export interface StoredFile {
  id: string;
  filename: string;
  mime: string;
  size: number;
  createdAt: string;
}

export interface Session {
  role: "admin" | "counsellor";
  expiresAt: string;
}

export interface LeadFilters {
  q?: string;
  program?: string;
  learnerType?: string;
  status?: string;
  from?: string;
  to?: string;
  includeSample?: boolean;
  limit?: number;
}

export const CONVERTED_STATUSES: LeadStatus[] = [
  "Registered",
  "Training Started",
  "Completed",
];
