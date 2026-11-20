import { RegistrationRoster } from "@/components/admin/registration-roster";
import { RegistrationsBoard } from "@/components/admin/registrations-board";
import { getStore } from "@/lib/store";
import { currentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const session = await currentSession();
  const canDelete = session?.role === "admin";
  const rows = (await getStore().listRegistrations())
    .filter((item) => !item.sample)
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
      <RegistrationRoster rows={rows} canDelete={canDelete} />
    </div>
  );
}
