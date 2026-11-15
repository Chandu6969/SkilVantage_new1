import { istDate, todayIST } from "@/lib/dates";
import { programs } from "@/lib/content";
import {
  CONVERTED_STATUSES,
  type AnalyticsEvent,
  type Enquiry,
  type LeadFilters,
  type ProgramSlug,
  type Registration,
} from "@/lib/types";

export function isFollowUpPending(registration: Registration, today = todayIST()) {
  if (registration.status === "Completed" || registration.status === "Not Interested") return false;
  if (registration.status === "Follow-up Required") return true;
  return Boolean(registration.followUpDate && registration.followUpDate <= today);
}

export function matchesLead(registration: Registration, filters: LeadFilters) {
  if (!filters.includeSample && registration.sample) return false;
  if (filters.program && registration.program !== filters.program) return false;
  if (filters.learnerType && registration.learnerType !== filters.learnerType) return false;
  if (filters.status && registration.status !== filters.status) return false;
  const day = istDate(registration.createdAt);
  if (filters.from && day < filters.from) return false;
  if (filters.to && day > filters.to) return false;
  if (filters.q) {
    const haystack = [
      registration.id,
      registration.fullName,
      registration.email,
      registration.phone,
      registration.city,
      registration.college,
      registration.company,
      registration.preferredRole,
      registration.targetRole,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(filters.q.trim().toLowerCase())) return false;
  }
  return true;
}

export function dashboardFrom(registrations: Registration[], enquiries: Enquiry[]) {
  const real = registrations.filter((item) => !item.sample);
  const usingSample = real.length === 0;
  const rows = usingSample ? registrations : real;
  const realEnquiries = enquiries.filter((item) => !item.sample);
  const byProgram = Object.fromEntries(programs.map((program) => [program.slug, 0])) as Record<ProgramSlug, number>;
  for (const row of rows) byProgram[row.program] += 1;
  const converted = rows.filter((row) => CONVERTED_STATUSES.includes(row.status)).length;
  const today = todayIST();
  return {
    total: rows.length,
    students: rows.filter((row) => row.learnerType === "student").length,
    professionals: rows.filter((row) => row.learnerType === "professional").length,
    byProgram,
    newCount: rows.filter((row) => row.status === "New").length,
    followUpsPending: rows.filter((row) => isFollowUpPending(row, today)).length,
    converted,
    conversionRate: rows.length ? Math.round((converted / rows.length) * 1000) / 10 : null,
    recent: [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    pendingFollowUps: rows.filter((row) => isFollowUpPending(row, today)).slice(0, 8),
    usingSample,
    enquiries: usingSample ? enquiries.length : realEnquiries.length,
  };
}

export function summarizeAnalytics(events: AnalyticsEvent[], registrations: Registration[]) {
  const realEvents = events.filter((event) => !event.sample);
  const realRegistrations = registrations.filter((item) => !item.sample);
  const usingSample = realEvents.length === 0 && realRegistrations.length === 0;
  const sourceEvents = usingSample ? events : realEvents;
  const sourceRegistrations = usingSample ? registrations : realRegistrations;
  const views = sourceEvents.filter((event) => event.eventType === "page_view" || event.eventType === "course_view");
  const visitors = new Set(views.map((event) => event.visitorId).filter(Boolean));
  const courseCounts = new Map<string, number>();
  for (const event of sourceEvents.filter((event) => event.eventType === "course_view" && event.course)) {
    courseCounts.set(event.course!, (courseCounts.get(event.course!) || 0) + 1);
  }
  const courseViews = [...courseCounts.entries()]
    .map(([course, count]) => ({ course, views: count }))
    .sort((a, b) => b.views - a.views);
  const sources = new Map<string, number>();
  for (const registration of sourceRegistrations) {
    const key = registration.source || "Not shared";
    sources.set(key, (sources.get(key) || 0) + 1);
  }
  const devices = new Map<string, number>();
  for (const event of views) devices.set(event.device, (devices.get(event.device) || 0) + 1);
  const interest = { student: 0, professional: 0 };
  for (const event of sourceEvents.filter((event) => event.eventType === "learner_choice" && event.learnerType)) {
    if (event.learnerType === "student" || event.learnerType === "professional") {
      interest[event.learnerType] += 1;
    }
  }
  const days = Array.from({ length: 14 }, (_, index) => {
    const day = new Date();
    day.setUTCDate(day.getUTCDate() - (13 - index));
    return todayIST(day);
  });
  return {
    usingSample,
    pageViews: views.length,
    visitors: visitors.size,
    courseViews,
    popularCourse: courseViews[0] || null,
    registrations: sourceRegistrations.length,
    learnerMix: {
      student: sourceRegistrations.filter((item) => item.learnerType === "student").length,
      professional: sourceRegistrations.filter((item) => item.learnerType === "professional").length,
    },
    interest,
    sources: [...sources.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
    devices: [...devices.entries()].map(([device, count]) => ({ device, count })),
    daily: days.map((date) => ({
      date,
      views: views.filter((event) => istDate(event.createdAt) === date).length,
      registrations: sourceRegistrations.filter((item) => istDate(item.createdAt) === date).length,
    })),
  };
}
