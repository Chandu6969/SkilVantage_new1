import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { settleCash } from "../src/lib/cash-book";
import type { CashBook, CashEntry } from "../src/lib/types";

const book: CashBook = { openingCash: 0, openingBank: 46542, updatedAt: "", syncedAt: "" };

function entry(partial: Partial<CashEntry> & Pick<CashEntry, "id" | "date" | "flow" | "account" | "amount">): CashEntry {
  return {
    category: "Student Fee",
    party: "",
    reference: "",
    mode: "UPI",
    description: "",
    createdAt: `${partial.date}T00:00:00.000Z`,
    ...partial,
  };
}

test("opening balances are not income and a bank receipt carries into the next month", () => {
  const entries = [
    entry({ id: "1", date: "2026-11-08", flow: "in", account: "bank", amount: 1249, party: "Sankisa Bharathi" }),
    entry({ id: "2", date: "2026-12-02", flow: "out", account: "bank", amount: 200, category: "Internet" }),
  ];
  const november = settleCash(book, entries, { month: "2026-11", account: "all", flow: "all", query: "" });
  assert.equal(november.cash, 0);
  assert.equal(november.bank, 47591);
  assert.equal(november.periodIn, 1249);
  assert.equal(november.periodOut, 0);
  assert.equal(november.rows.length, 1);
  assert.equal(november.rows[0]?.before, 46542);
  assert.equal(november.rows[0]?.after, 47791);

  const december = settleCash(book, entries, { month: "2026-12", account: "bank", flow: "all", query: "" });
  assert.equal(december.rows[0]?.before, 47791);
  assert.equal(december.rows[0]?.after, 47591);
  assert.equal(december.periodOut, 200);
});

test("a transfer moves cash into the bank without changing the total", () => {
  const snapshot = settleCash(
    { openingCash: 1000, openingBank: 0, updatedAt: "", syncedAt: "" },
    [entry({ id: "t", date: "2026-11-01", flow: "transfer", account: "cash", amount: 400, category: "Transfer" })],
    { month: "", account: "all", flow: "all", query: "" },
  );
  assert.equal(snapshot.cash, 600);
  assert.equal(snapshot.bank, 400);
  assert.equal(snapshot.total, 1000);
  assert.equal(snapshot.periodIn, 0);
  assert.equal(snapshot.periodOut, 0);
  assert.equal(snapshot.rows[0]?.before, 1000);
  assert.equal(snapshot.rows[0]?.after, 1000);
});

test("the cash book keeps an opening balance and a transaction", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sv-cash-"));
  process.env.DATA_DIR = dir;
  delete process.env.DATABASE_URL;
  delete process.env.MONGODB_URI;
  const storeModule = await import("../src/lib/store/index");
  storeModule.resetStoreForTests();
  const store = storeModule.getStore();
  const saved = await store.saveCashBook({ openingCash: 500, openingBank: 1500 });
  assert.equal(saved.openingCash, 500);
  assert.equal(saved.openingBank, 1500);
  await store.addCashEntry(entry({ id: "SVC-TEST01", date: "2026-11-18", flow: "in", account: "cash", amount: 250 }));
  const updated = await store.updateCashEntry("SVC-TEST01", {
    date: "2026-11-18",
    flow: "in",
    account: "cash",
    category: "Student Fee",
    amount: 300,
    party: "",
    reference: "",
    mode: "UPI",
    description: "",
  });
  assert.equal(updated?.amount, 300);
  assert.equal((await store.listCashEntries()).length, 1);
  assert.equal(await store.deleteCashEntry("SVC-TEST01"), true);
  assert.equal((await store.listCashEntries()).length, 0);
  storeModule.resetStoreForTests();
});
