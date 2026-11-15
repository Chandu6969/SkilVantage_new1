import Link from "next/link";
import { SheetsSync } from "@/components/sheets-sync";
import { programs } from "@/lib/content";
import { formatStamp } from "@/lib/dates";
import { dashboardFrom, summarizeAnalytics } from "@/lib/metrics";
import { sheetsStatus } from "@/lib/sheets";
import { getStore } from "@/lib/store";
import { currentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const session = await currentSession();
  const store = getStore();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [registrations, enquiries, events] = await Promise.all([
    store.listRegistrations(),
    store.listEnquiries(),
    store.listEventsSince(since),
  ]);
  const dashboard = dashboardFrom(registrations, enquiries);
  const analytics = summarizeAnalytics(events, registrations);
  const sheets = sheetsStatus();
  const cards = [
    ["Total leads", dashboard.total],
    ["Student leads", dashboard.students],
    ["Professional leads", dashboard.professionals],
    ["New registrations", dashboard.newCount],
    ["Follow-ups pending", dashboard.followUpsPending],
    ["Converted students", dashboard.converted],
    ["Conversion rate", dashboard.conversionRate === null ? "—" : `${dashboard.conversionRate}%`],
    ["Enquiries", dashboard.enquiries],
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl text-ink">Overview</h1>
          <p className="mt-2 text-sm text-muted-foreground">Times are shown in IST. Storage: {store.kind === "postgres" ? "Postgres" : "server file, until a database is connected"}.</p>
        </div>
        {session?.role === "admin" ? <SheetsSync configured={sheets.configured} /> : null}
      </div>
      {dashboard.usingSample ? (
        <p className="rounded-2xl bg-secondary px-4 py-3 text-sm">Showing sample leads so the desk is visible before the first real registration. Sample records are labeled and drop out of these counts after a real registration arrives.</p>
      ) : null}
      {!sheets.configured ? (
        <p className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">Google Sheets is not connected. Registrations are stored in the application database. Add the sheet id and service account to mirror them into Student Registrations, Professional Registrations, Course Enquiries, Course List, and Follow-ups.</p>
      ) : (
        <p className="text-sm text-muted-foreground">Google Sheets is connected.{sheets.lastError ? ` Last error: ${sheets.lastError}` : ""}</p>
      )}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <article key={String(label)} className="rounded-3xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 font-heading text-3xl text-ink">{value}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-border bg-card p-5">
          <h2 className="text-xl text-ink">Registrations by course</h2>
          <Bars items={programs.map((program) => ({ label: program.shortName, value: dashboard.byProgram[program.slug] }))} />
          <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
            <li>Data Analyst leads: {dashboard.byProgram["data-analyst"]}</li>
            <li>Data Science leads: {dashboard.byProgram["data-scientist"]}</li>
            <li>AI/ML leads: {dashboard.byProgram["ai-ml"]}</li>
            <li>GenAI leads: {dashboard.byProgram["generative-ai"]}</li>
            <li>Agentic AI leads: {dashboard.byProgram["agentic-ai"]}</li>
          </ul>
        </article>
        <article className="rounded-3xl border border-border bg-card p-5">
          <h2 className="text-xl text-ink">Last 30 days</h2>
          <p className="mt-2 text-sm text-muted-foreground">{analytics.visitors} visitors · {analytics.pageViews} page views · {analytics.registrations} registrations in view</p>
          <p className="mt-3 text-sm">Most read course: {analytics.popularCourse ? `${analytics.popularCourse.course} (${analytics.popularCourse.views} views)` : "No course views yet"}</p>
          <h3 className="mt-4 text-sm font-medium">Student and professional registrations</h3>
          <Bars items={[{ label: "Students", value: analytics.learnerMix.student }, { label: "Professionals", value: analytics.learnerMix.professional }]} />
          <h3 className="mt-4 text-sm font-medium">Device</h3>
          <Bars items={analytics.devices.map((item) => ({ label: item.device, value: item.count }))} />
          <h3 className="mt-4 text-sm font-medium">Registration source</h3>
          <Bars items={analytics.sources.map((item) => ({ label: item.source, value: item.count }))} />
        </article>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <article>
          <h2 className="text-xl text-ink">New and recent registrations</h2>
          <ul className="mt-3 divide-y divide-border rounded-3xl border border-border bg-card">
            {dashboard.recent.map((lead) => (
              <li key={lead.id} className="px-4 py-3 text-sm">
                <Link href={`/admin/leads/${lead.id}`} className="font-medium text-ink hover:underline">{lead.fullName}</Link>
                <p className="text-muted-foreground">{lead.sample ? "Sample · " : ""}{lead.status} · {formatStamp(lead.createdAt)}</p>
              </li>
            ))}
          </ul>
        </article>
        <article>
          <h2 className="text-xl text-ink">Follow-ups pending</h2>
          {dashboard.pendingFollowUps.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No follow-ups are due.</p> : (
            <ul className="mt-3 divide-y divide-border rounded-3xl border border-border bg-card">
              {dashboard.pendingFollowUps.map((lead) => (
                <li key={lead.id} className="px-4 py-3 text-sm">
                  <Link href={`/admin/leads/${lead.id}`} className="font-medium text-ink hover:underline">{lead.fullName}</Link>
                  <p className="text-muted-foreground">{lead.followUpDate || lead.status}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}

function Bars({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  if (items.length === 0) return <p className="mt-3 text-sm text-muted-foreground">No data yet.</p>;
  return (
    <div className="mt-4 space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-sm"><span>{item.label}</span><span>{item.value}</span></div>
          <div className="mt-1 h-2 rounded-full bg-secondary">
            <div className="h-2 rounded-full bg-ink" style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
