import crypto from "crypto";
import type { LearnerType } from "@/lib/types";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}

export function registrationId(learnerType: LearnerType) {
  return `${learnerType === "student" ? "SVS" : "SVP"}-${randomCode(6)}`;
}

export function enquiryId() {
  return `SVE-${randomCode(6)}`;
}

export function followUpId() {
  return `SVF-${randomCode(6)}`;
}

export function fileId() {
  return `SVR-${randomCode(8)}`;
}

export function batchId() {
  return `SVB-${randomCode(6)}`;
}

export function memberId() {
  return `SVM-${randomCode(6)}`;
}

export function attendanceId() {
  return `SVA-${randomCode(6)}`;
}

export function feeId() {
  return `SVY-${randomCode(6)}`;
}

export function assignmentId() {
  return `SVG-${randomCode(6)}`;
}

export function teacherNoteId() {
  return `SVT-${randomCode(6)}`;
}

export function facultyId() {
  return `SVQ-${randomCode(6)}`;
}

export function facultyDayId() {
  return `SVD-${randomCode(6)}`;
}

export function facultyPayId() {
  return `SVK-${randomCode(6)}`;
}

export function removedId() {
  return `SVX-${randomCode(6)}`;
}

export function isRegistrationId(value: string) {
  return /^SV[SP]-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(value);
}
