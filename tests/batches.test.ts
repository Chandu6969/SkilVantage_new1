import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("student batches start with SASI and WISE and keep an added person", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sv-batches-"));
  process.env.DATA_DIR = dir;
  delete process.env.DATABASE_URL;
  const storeModule = await import("../src/lib/store/index");
  storeModule.resetStoreForTests();
  const store = storeModule.getStore();
  const batches = await store.listBatches("student");
  assert.deepEqual(batches.map((batch) => batch.name), ["SASI", "WISE"]);
  assert.equal(batches[0]?.label, "1st batch");
  assert.equal(batches[1]?.label, "2nd batch");
  const created = await store.createBatch({ name: "Evening", learnerType: "professional" });
  assert.equal(created.label, "1st batch");
  await store.addMember({
    id: "SVM-TEST01",
    batchId: batches[0]!.id,
    fullName: "Sample Student",
    phone: "9845011122",
    email: "",
    note: "",
    messaged: false,
    absentToday: false,
    createdAt: new Date().toISOString(),
  });
  const members = await store.listMembers(batches[0]!.id);
  assert.equal(members.length, 1);
  assert.equal(members[0]?.fullName, "Sample Student");
  storeModule.resetStoreForTests();
});
