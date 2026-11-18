import { CashBoard } from "@/components/admin/cash-board";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CashPage() {
  const store = getStore();
  const [book, entries] = await Promise.all([store.getCashBook(), store.listCashEntries()]);
  return <CashBoard book={book} entries={entries} />;
}
