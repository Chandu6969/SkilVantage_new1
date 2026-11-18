import Link from "next/link";
import { RegistrationsBoard } from "@/components/admin/registrations-board";
import { programs } from "@/lib/content";
import { formatStamp } from "@/lib/dates";
import { matchesLead } from "@/lib/metrics";
import { programName } from "@/lib/palette";
import { getStore } from "@/lib/store";
import { LEAD_STATUSES } from "@/lib/types";
import { currentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const session = await currentSession();
  const filters = {
    q: params.q,
    program: params.program,
    learnerType: params.learnerType,
    status: params.status,
    from: params.from,
    to: params.to,
    includeSample: params.includeSample === "1",
  };
  const rows = (await getStore().listRegistrations())
    .filter((item) => matchesLead(item, filters))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#6d4dff] px-3 py-1 text-xs font-semibold tracking-[0.14em] text-white uppercase">Registrations</p>
        {session?.role === "admin" ? (
          <div className="flex flex-col gap-2 text-sm sm:flex-row">
            <a className="underline" href="/api/v1/admin/export?type=students">Export students</a>
            <a className="underline" href="/api/v1/admin/export?type=professionals">Export professionals</a>
            <a className="underline" href="/api/v1/admin/export?type=all">Export all</a>
          </div>
        ) : null}
      </div>
      <RegistrationsBoard rows={rows} />
      <form className="mt-4 grid gap-3 rounded-3xl border border-[var(--desk-line)] bg-[var(--desk-card)] p-4 md:grid-cols-3" method="get">
        <label className="field">Search<input name="q" defaultValue={params.q || ""} placeholder="Name, email, phone, id" /></label>
        <label className="field">Course
          <select name="program" defaultValue={params.program || ""}>
            <option value="">All courses</option>
            {programs.map((program) => <option key={program.slug} value={program.slug}>{program.name}</option>)}
          </select>
        </label>
        <label className="field">Learner
          <select name="learnerType" defaultValue={params.learnerType || ""}>
            <option value="">Students and professionals</option>
            <option value="student">Student / Fresher</option>
            <option value="professional">Working Professional</option>
          </select>
        </label>
        <label className="field">Status
          <select name="status" defaultValue={params.status || ""}>
            <option value="">Any status</option>
            {LEAD_STATUSES.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <label className="field">From<input type="date" name="from" defaultValue={params.from || ""} /></label>
        <label className="field">To<input type="date" name="to" defaultValue={params.to || ""} /></label>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="includeSample" value="1" defaultChecked={params.includeSample === "1"} />
          Include sample records
        </label>
        <div className="flex gap-3">
          <button className="h-12 flex-1 rounded-xl bg-[#6d4dff] text-white" type="submit">Apply filters</button>
          <Link href="/admin/leads" className="inline-flex h-12 items-center px-3 text-sm underline">Clear</Link>
        </div>
      </form>
      <h2 className="mt-6 text-lg font-semibold">All registrations</h2>
      <p className="mt-1 text-sm text-[var(--desk-muted)]">{rows.length} matching records.</p>
      <div className="mt-4 space-y-3 lg:hidden">
        {rows.slice(0, 200).map((lead) => (
          <Link key={lead.id} href={`/admin/leads/${lead.id}`} className="block rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] p-4">
            <p className="font-medium">{lead.fullName}</p>
            <p className="text-sm text-[var(--desk-muted)]">{lead.learnerType === "student" ? "Student" : "Professional"} · {programName(lead.program)} · {lead.status}</p>
            <p className="text-sm text-[var(--desk-muted)]">{lead.phone}{lead.email ? ` · ${lead.email}` : ""}</p>
            <p className="text-sm text-[var(--desk-muted)]">{formatStamp(lead.createdAt)}{lead.sample ? " · Sample" : ""}</p>
          </Link>
        ))}
      </div>
      <div className="mt-4 hidden overflow-x-auto rounded-3xl border border-[var(--desk-line)] bg-[var(--desk-card)] lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--desk-line)] text-[var(--desk-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Date (IST)</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Course</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 200).map((lead) => (
              <tr key={lead.id} className="border-b border-[var(--desk-line)] last:border-0">
                <td className="px-4 py-3 whitespace-nowrap">{formatStamp(lead.createdAt)}</td>
                <td className="px-4 py-3"><Link className="underline-offset-4 hover:underline" href={`/admin/leads/${lead.id}`}>{lead.fullName}</Link>{lead.sample ? " · sample" : ""}</td>
                <td className="px-4 py-3">{lead.phone}</td>
                <td className="px-4 py-3">{lead.learnerType === "student" ? "Student" : "Professional"}</td>
                <td className="px-4 py-3">{programName(lead.program)}</td>
                <td className="px-4 py-3">{lead.status}</td>
                <td className="px-4 py-3">{lead.followUpDate || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 200 ? <p className="mt-3 text-sm text-[var(--desk-muted)]">Showing the latest 200 matches. Export CSV for the full list.</p> : null}
      {rows.length === 0 ? <p className="mt-6 text-sm text-[var(--desk-muted)]">No registrations match these filters.</p> : null}
    </div>
  );
}
