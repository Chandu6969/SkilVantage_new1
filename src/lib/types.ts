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

export interface TrainingBatch {
  id: string;
  name: string;
  label: string;
  learnerType: LearnerType;
  sort: number;
  createdAt: string;
}

export interface BatchMember {
  id: string;
  batchId: string;
  fullName: string;
  phone: string;
  email: string;
  note: string;
  messaged: boolean;
  absentToday: boolean;
  createdAt: string;
}

export interface RemovedLearner {
  id: string;
  memberId: string;
  batchId: string;
  batchName: string;
  learnerType: LearnerType;
  fullName: string;
  phone: string;
  email: string;
  registrationId: string;
  removedAt: string;
}

export type AttendanceStatus = "present" | "absent";
export type ClassDayStatus = AttendanceStatus | "leave" | "holiday" | "late";
export type FeeKind = "cash" | "bank" | "upi";
export type AssignmentProgress = "pending" | "submitted" | "reviewed";

export interface AttendanceMark {
  id: string;
  batchId: string;
  memberId: string;
  date: string;
  status: ClassDayStatus;
  createdAt: string;
}

export interface FeePayment {
  id: string;
  batchId: string;
  memberId: string;
  amount: number;
  kind: FeeKind;
  paidOn: string;
  note: string;
  createdAt: string;
}

export type CashAccount = "cash" | "bank";
export type CashFlow = "in" | "out" | "transfer";

export interface CashBook {
  openingCash: number;
  openingBank: number;
  updatedAt: string;
  syncedAt: string;
}

export interface CashEntry {
  id: string;
  date: string;
  flow: CashFlow;
  account: CashAccount;
  category: string;
  amount: number;
  party: string;
  reference: string;
  mode: string;
  description: string;
  memberId?: string;
  batchId?: string;
  feeId?: string;
  createdAt: string;
}

export interface ClassAssignment {
  id: string;
  batchId: string;
  memberId: string;
  title: string;
  dueOn: string;
  status: AssignmentProgress;
  createdAt: string;
}

export interface TeacherNote {
  id: string;
  batchId: string;
  body: string;
  createdAt: string;
}

export interface Faculty {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  course: ProgramSlug;
  rate: number;
  note: string;
  createdAt: string;
}

export interface FacultyDay {
  id: string;
  teacherId: string;
  date: string;
  status: AttendanceStatus;
  createdAt: string;
}

export type FacultyPayStatus = "due" | "paid";
export type ClassRecordKind = "taken" | "deducted";

export interface FacultyPay {
  id: string;
  teacherId: string;
  amount: number;
  classDate: string;
  paidOn: string;
  status: FacultyPayStatus;
  note: string;
  subject?: string;
  session?: string;
  kind?: ClassRecordKind;
  createdAt: string;
}

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
