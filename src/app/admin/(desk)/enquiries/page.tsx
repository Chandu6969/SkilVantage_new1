import { EnquiryEditor } from "@/components/enquiry-editor";
import { formatStamp } from "@/lib/dates";
import { getStore } from "@/lib/store";
import { currentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ includeSample?: string }> }) {
  const params = await searchParams;
  const session = await currentSession();
  const includeSample = params.includeSample === "1";
  const rows = (await getStore().listEnquiries())
    .filter((item) => includeSample || !item.sample)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="desk-paper">
      <h1 className="text-4xl text-ink">Enquiries</h1>
      <p className="mt-2 text-sm text-muted-foreground">{rows.length} messages. {session?.role === "admin" ? <a className="underline" href="/api/v1/admin/export?type=enquiries">Export enquiries</a> : null}</p>
      <div className="mt-6 space-y-4">
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">No enquiries yet.</p> : null}
        {rows.map((enquiry) => (
          <article key={enquiry.id} className="rounded-3xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl text-ink">{enquiry.name}</h2>
              <p className="text-sm text-muted-foreground">{formatStamp(enquiry.createdAt)} IST{enquiry.sample ? " · Sample" : ""}</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{enquiry.phone} · {enquiry.email}</p>
            <p className="mt-1 text-sm">Course: {enquiry.course} · {enquiry.learnerType} · {enquiry.kind}</p>
            <p className="mt-3 text-sm leading-relaxed">{enquiry.message}</p>
            <EnquiryEditor id={enquiry.id} status={enquiry.status} notes={enquiry.notes} />
          </article>
        ))}
      </div>
    </div>
  );
}
