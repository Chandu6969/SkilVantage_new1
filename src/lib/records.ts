import { enquiryId, fileId, followUpId, registrationId } from "@/lib/ids";
import { getProgram } from "@/lib/content";
import type { EnquiryInput, ProfessionalInput, StudentInput } from "@/lib/validation";
import type { Enquiry, FollowUp, Registration } from "@/lib/types";

const empty = {
  gender: "",
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
};

export function registrationFromInput(
  input: StudentInput | ProfessionalInput,
  resume: { id: string; name: string } | null,
): Registration {
  const now = new Date().toISOString();
  const shared = {
    ...empty,
    id: registrationId(input.learnerType),
    createdAt: now,
    learnerType: input.learnerType,
    program: input.program,
    status: "New" as const,
    fullName: input.fullName,
    phone: input.phone.replace(/\s+/g, " ").trim(),
    email: input.email,
    city: input.city,
    state: input.state,
    linkedin: input.linkedin,
    github: input.github,
    expectedPackage: input.expectedPackage,
    learningMode: input.learningMode,
    counsellorNotes: "",
    followUpDate: null,
    resumeFileId: resume?.id ?? null,
    resumeName: resume?.name ?? null,
    sheetsSynced: false,
    sample: false,
    consentAt: now,
  };
  if (input.learnerType === "student") {
    return {
      ...shared,
      gender: input.gender,
      college: input.college,
      degree: input.degree,
      branch: input.branch,
      passedOutYear: input.passedOutYear,
      currentYear: input.currentYear,
      skills: input.skills,
      programmingLanguages: input.programmingLanguages,
      tools: input.tools,
      projects: input.projects,
      certifications: input.certifications,
      preferredTrack: input.preferredTrack,
      preferredRole: input.preferredRole,
      opportunity: input.opportunity,
      availability: input.availability,
      source: input.source,
    };
  }
  return {
    ...shared,
    company: input.company,
    currentRole: input.currentRole,
    experience: input.experience,
    industry: input.industry,
    currentSkills: input.currentSkills,
    previousExperience: input.previousExperience,
    targetTrack: input.targetTrack,
    targetRole: input.targetRole,
    careerChangeReason: input.careerChangeReason,
    currentPackage: input.currentPackage,
    noticePeriod: input.noticePeriod,
    batchTiming: input.batchTiming,
    preferredRole: input.targetRole,
    source: input.source,
  };
}

export function enquiryFromInput(input: EnquiryInput): Enquiry {
  return {
    id: enquiryId(),
    createdAt: new Date().toISOString(),
    name: input.name,
    phone: input.phone.replace(/\s+/g, " ").trim(),
    email: input.email,
    course: input.course,
    learnerType: input.learnerType,
    message: input.message,
    kind: input.kind,
    status: "New",
    notes: "",
    sample: false,
    sheetsSynced: false,
  };
}

export function followUpFrom(registration: Registration, counsellor: string, notes: string): FollowUp | null {
  if (!registration.followUpDate) return null;
  return {
    id: followUpId(),
    registrationId: registration.id,
    name: registration.fullName,
    phone: registration.phone,
    course: getProgram(registration.program)?.name || registration.program,
    followUpDate: registration.followUpDate,
    counsellor: counsellor || "Career team",
    status: registration.status,
    notes,
    createdAt: new Date().toISOString(),
    sheetsSynced: false,
  };
}

export function newFileMeta(filename: string, mime: string, size: number) {
  return { id: fileId(), filename, mime, size, createdAt: new Date().toISOString() };
}
