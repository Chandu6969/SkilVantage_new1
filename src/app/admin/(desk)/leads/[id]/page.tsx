import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadEditor } from "@/components/lead-editor";
import { currentSession } from "@/lib/auth";
import { getProgram } from "@/lib/content";
import { formatStamp } from "@/lib/dates";
import { getStore } from "@/lib/store";
import { safeHttpUrl } from "@/lib/text";
import type { Registration } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lead, session] = await Promise.all([getStore().getRegistration(id), currentSession()]);
  if (!lead || !session) notFound();
  const program = getProgram(lead.program);
  const linkedin = safeHttpUrl(lead.linkedin);
  const github = safeHttpUrl(lead.github);
  const rows = detailRows(lead);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <Link href="/admin/leads" className="text-sm text-muted-foreground underline-offset-4 hover:underline">All registrations</Link>
        <h1 className="mt-2 text-4xl text-ink">{lead.fullName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{lead.id} · {formatStamp(lead.createdAt)} IST · {program?.name} · {lead.status}{lead.sample ? " · Sample" : ""}</p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-border bg-card px-4 py-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-sm break-words text-ink">{value || "—"}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row">
          {linkedin ? <a className="underline" href={linkedin}>LinkedIn</a> : null}
          {github ? <a className="underline" href={github}>GitHub</a> : null}
          {lead.resumeFileId ? <a className="underline" href={`/api/v1/admin/files/${lead.resumeFileId}`}>Download resume</a> : <span className="text-muted-foreground">No resume uploaded</span>}
        </div>
      </div>
      <LeadEditor id={lead.id} status={lead.status} notes={lead.counsellorNotes} followUpDate={lead.followUpDate} canDelete={session.role === "admin" && !lead.sample} />
    </div>
  );
}

function detailRows(lead: Registration): [string, string][] {
  const common: [string, string][] = [
    ["Phone", lead.phone],
    ["Email", lead.email],
    ["City", lead.city],
    ["State", lead.state],
    ["Learning mode", lead.learningMode],
    ["Source", lead.source],
    ["Expected package", lead.expectedPackage],
  ];
  if (lead.learnerType === "student") {
    return [
      ...common,
      ["Gender", lead.gender],
      ["College", lead.college],
      ["Degree", lead.degree],
      ["Branch", lead.branch],
      ["Passed out year", lead.passedOutYear],
      ["Current year", lead.currentYear],
      ["Skills", lead.skills],
      ["Languages", lead.programmingLanguages],
      ["Tools", lead.tools],
      ["Projects", lead.projects],
      ["Certifications", lead.certifications],
      ["Preferred track", getProgram(lead.preferredTrack)?.name || lead.preferredTrack],
      ["Preferred role", lead.preferredRole],
      ["Internship / job", lead.opportunity],
      ["Availability", lead.availability],
    ];
  }
  return [
    ...common,
    ["Company", lead.company],
    ["Current role", lead.currentRole],
    ["Experience", lead.experience],
    ["Industry", lead.industry],
    ["Current skills", lead.currentSkills],
    ["Previous experience", lead.previousExperience],
    ["Target track", lead.targetTrack],
    ["Target role", lead.targetRole],
    ["Reason", lead.careerChangeReason],
    ["Current package", lead.currentPackage],
    ["Notice period", lead.noticePeriod],
    ["Batch timing", lead.batchTiming],
  ];
}
