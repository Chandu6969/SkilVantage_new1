import type { CashAccount, CashBook, CashEntry, CashFlow } from "@/lib/types";

export const CASH_CATEGORIES = ["Student Fee", "Professional Fee", "Teacher Payment", "Rent", "Internet", "Salary", "Office", "Transfer", "Other"] as const;
export const CASH_MODES = ["Cash", "UPI", "Bank Transfer", "Card", "Cheque"] as const;

export type CashFilter = {
  month: string;
  account: "all" | CashAccount;
  flow: "all" | CashFlow;
  query: string;
};

export type CashRow = {
  entry: CashEntry;
  before: number;
  after: number;
};

export type CashSnapshot = {
  cash: number;
  bank: number;
  total: number;
  periodIn: number;
  periodOut: number;
  net: number;
  rows: CashRow[];
};

export function emptyCashBook(): CashBook {
  return { openingCash: 0, openingBank: 0, updatedAt: "", syncedAt: "" };
}

export function settleCash(book: CashBook, entries: CashEntry[], filter: CashFilter): CashSnapshot {
  const ordered = [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  const balances = { cash: book.openingCash, bank: book.openingBank };
  const rows: CashRow[] = [];
  let periodIn = 0;
  let periodOut = 0;
  const needle = filter.query.trim().toLowerCase();

  for (const entry of ordered) {
    const before = { cash: balances.cash, bank: balances.bank };
    applyEntry(balances, entry);
    const inPeriod = !filter.month || entry.date.startsWith(filter.month);
    const touchesAccount = filter.account === "all" || entry.account === filter.account || (entry.flow === "transfer" && otherAccount(entry.account) === filter.account);
    if (inPeriod && touchesAccount) {
      if (entry.flow === "in" && (filter.account === "all" || entry.account === filter.account)) periodIn += entry.amount;
      if (entry.flow === "out" && (filter.account === "all" || entry.account === filter.account)) periodOut += entry.amount;
    }
    const matchesFlow = filter.flow === "all" || entry.flow === filter.flow;
    const haystack = `${entry.description} ${entry.party} ${entry.reference} ${entry.category}`.toLowerCase();
    if (inPeriod && touchesAccount && matchesFlow && (!needle || haystack.includes(needle))) {
      rows.push({ entry, before: scoped(before, filter.account), after: scoped(balances, filter.account) });
    }
  }

  return {
    cash: balances.cash,
    bank: balances.bank,
    total: balances.cash + balances.bank,
    periodIn,
    periodOut,
    net: periodIn - periodOut,
    rows: rows.reverse(),
  };
}

function applyEntry(balances: { cash: number; bank: number }, entry: CashEntry) {
  if (entry.flow === "transfer") {
    balances[entry.account] -= entry.amount;
    balances[otherAccount(entry.account)] += entry.amount;
    return;
  }
  balances[entry.account] += entry.flow === "in" ? entry.amount : -entry.amount;
}

function otherAccount(account: CashAccount): CashAccount {
  return account === "cash" ? "bank" : "cash";
}

function scoped(balances: { cash: number; bank: number }, account: CashFilter["account"]) {
  if (account === "cash") return balances.cash;
  if (account === "bank") return balances.bank;
  return balances.cash + balances.bank;
}
