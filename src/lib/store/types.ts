import type {
  AnalyticsEvent,
  BatchMember,
  Enquiry,
  FollowUp,
  LearnerType,
  Registration,
  Session,
  StoredFile,
  TrainingBatch,
} from "@/lib/types";

/**
 * Lead store used by the website and by /api/v1.
 * Postgres is used when DATABASE_URL is set. Otherwise a private server file is used.
 * Google Sheets is a mirror, not the only copy.
 *
 * Later learner features (accounts, lessons, assignments, quizzes, project
 * submissions, attendance, progress, certificates, notifications, mentor
 * messages, job opportunities) should be new methods on this store and new
 * /api/v1 resources. The public site should keep calling the API, not a
 * second data model.
 */
export interface LeadStore {
  kind: "postgres" | "file";
  getSecret(name: string): Promise<string>;
  insertRegistration(record: Registration): Promise<void>;
  findRecentDuplicate(email: string, program: string): Promise<Registration | null>;
  getRegistration(id: string): Promise<Registration | null>;
  listRegistrations(): Promise<Registration[]>;
  updateRegistration(id: string, patch: Partial<Registration>): Promise<Registration | null>;
  deleteRegistration(id: string): Promise<boolean>;
  insertEnquiry(record: Enquiry): Promise<void>;
  listEnquiries(): Promise<Enquiry[]>;
  updateEnquiry(id: string, patch: Partial<Enquiry>): Promise<Enquiry | null>;
  insertFollowUp(record: FollowUp): Promise<void>;
  listFollowUps(): Promise<FollowUp[]>;
  recordEvent(event: AnalyticsEvent): Promise<void>;
  listEventsSince(iso: string): Promise<AnalyticsEvent[]>;
  saveFile(file: StoredFile, bytes: Buffer): Promise<void>;
  getFile(id: string): Promise<(StoredFile & { data: Buffer }) | null>;
  deleteFile(id: string): Promise<void>;
  listBatches(learnerType?: LearnerType): Promise<TrainingBatch[]>;
  getBatch(id: string): Promise<TrainingBatch | null>;
  createBatch(input: { name: string; learnerType: LearnerType }): Promise<TrainingBatch>;
  listMembers(batchId: string): Promise<BatchMember[]>;
  addMember(member: BatchMember): Promise<void>;
  updateMember(id: string, patch: Partial<Pick<BatchMember, "messaged" | "absentToday">>): Promise<BatchMember | null>;
  resetMessaged(batchId: string): Promise<void>;
  createSession(role: Session["role"]): Promise<{ token: string; expiresAt: string }>;
  getSession(token: string): Promise<Session | null>;
  deleteSession(token: string): Promise<void>;
}
