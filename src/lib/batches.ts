import type { TrainingBatch } from "@/lib/types";

export const STARTER_BATCHES: TrainingBatch[] = [
  {
    id: "SVB-SASI",
    name: "SASI",
    label: "1st batch",
    learnerType: "student",
    sort: 1,
    createdAt: "2026-11-16T00:00:00.000Z",
  },
  {
    id: "SVB-WISE",
    name: "WISE",
    label: "2nd batch",
    learnerType: "student",
    sort: 2,
    createdAt: "2026-11-16T00:00:00.000Z",
  },
];

export const MESSAGE_TEMPLATES = [
  { id: "call", label: "Call me now", text: "Hi {name}, please call me when you see this." },
  { id: "start", label: "Class starting", text: "Hi {name}, class is starting. Please join now." },
  { id: "cancel", label: "Class cancelled", text: "Hi {name}, today's class is cancelled. I will share the new time." },
  { id: "time", label: "Time changed", text: "Hi {name}, the class time has changed. Please check the new timing." },
  { id: "absent", label: "Absent check-in", text: "Hi {name}, you were marked absent today. Reply here if you are joining late." },
] as const;

const AVATARS = ["#7c5cbf", "#3b6fd8", "#e08a2c", "#d15a78", "#1f9d78", "#6d5bd0"];

export function ordinalLabel(index: number) {
  const mod = index % 100;
  const suffix = mod >= 11 && mod <= 13 ? "th" : index % 10 === 1 ? "st" : index % 10 === 2 ? "nd" : index % 10 === 3 ? "rd" : "th";
  return `${index}${suffix} batch`;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const letters = parts.map((part) => part[0]?.toUpperCase() || "").join("");
  return letters || "?";
}

export function avatarColor(name: string) {
  let total = 0;
  for (const char of name) total += char.charCodeAt(0);
  return AVATARS[total % AVATARS.length]!;
}

export function displayPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  return phone;
}

export function whatsAppHref(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  const number = digits.length === 10 ? `91${digits}` : digits;
  if (number.length < 8 || number.length > 15) return null;
  const url = new URL(`https://wa.me/${number}`);
  if (text.trim()) url.searchParams.set("text", text.trim());
  return url.toString();
}

export function personalize(template: string, name: string) {
  const first = name.trim().split(/\s+/)[0] || name;
  return template.replaceAll("{name}", first);
}

export function deskDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
}
