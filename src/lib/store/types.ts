import type {
  AnalyticsEvent,
  AttendanceMark,
  BatchMember,
  RemovedLearner,
  ClassAssignment,
  Enquiry,
  Faculty,
  FacultyDay,
  FacultyPay,
  CashBook,
  CashEntry,
  FeePayment,
  TeacherNote,
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
  updateBatch(id: string, patch: { name: string }): Promise<TrainingBatch | null>;
  deleteBatch(id: string): Promise<boolean>;
  listMembers(batchId: string): Promise<BatchMember[]>;
  addMember(member: BatchMember): Promise<void>;
  updateMember(id: string, patch: Partial<Pick<BatchMember, "fullName" | "phone" | "email" | "note" | "batchId" | "messaged" | "absentToday">>): Promise<BatchMember | null>;
  removeMember(id: string): Promise<BatchMember | null>;
  listRemoved(learnerType?: LearnerType): Promise<RemovedLearner[]>;
  addRemoved(item: RemovedLearner): Promise<void>;
  resetMessaged(batchId: string): Promise<void>;
  listAttendance(batchId: string): Promise<AttendanceMark[]>;
  markAttendance(mark: AttendanceMark): Promise<AttendanceMark>;
  clearAttendance(batchId: string, memberId: string, date: string): Promise<void>;
  listFees(): Promise<FeePayment[]>;
  addFee(fee: FeePayment): Promise<void>;
  updateFee(fee: FeePayment): Promise<void>;
  deleteFee(id: string): Promise<boolean>;
  getCashBook(): Promise<CashBook>;
  saveCashBook(book: Pick<CashBook, "openingCash" | "openingBank">): Promise<CashBook>;
  markCashSynced(at: string): Promise<CashBook>;
  listCashEntries(): Promise<CashEntry[]>;
  addCashEntry(entry: CashEntry): Promise<void>;
  updateCashEntry(id: string, patch: Omit<CashEntry, "id" | "createdAt">): Promise<CashEntry | null>;
  deleteCashEntry(id: string): Promise<boolean>;
  listAssignments(batchId?: string): Promise<ClassAssignment[]>;
  addAssignment(item: ClassAssignment): Promise<void>;
  updateAssignment(id: string, status: ClassAssignment["status"]): Promise<ClassAssignment | null>;
  syncAssignments(batchId: string): Promise<void>;
  listTeacherNotes(batchId?: string): Promise<TeacherNote[]>;
  addTeacherNote(note: TeacherNote): Promise<void>;
  listFaculty(): Promise<Faculty[]>;
  addFaculty(person: Faculty): Promise<void>;
  updateFaculty(id: string, patch: Partial<Pick<Faculty, "fullName" | "phone" | "email" | "course" | "rate" | "note">>): Promise<Faculty | null>;
  deleteFaculty(id: string): Promise<boolean>;
  listFacultyDays(): Promise<FacultyDay[]>;
  markFacultyDay(day: FacultyDay): Promise<FacultyDay>;
  listFacultyPays(): Promise<FacultyPay[]>;
  saveFacultyPay(pay: FacultyPay): Promise<FacultyPay>;
  deleteFacultyPay(id: string): Promise<boolean>;
  settleFacultyPay(id: string, paidOn: string): Promise<FacultyPay | null>;
  createSession(role: Session["role"]): Promise<{ token: string; expiresAt: string }>;
  getSession(token: string): Promise<Session | null>;
  deleteSession(token: string): Promise<void>;
}
