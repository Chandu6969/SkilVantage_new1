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
  const marked = await store.markAttendance({
    id: "SVA-TEST01",
    batchId: batches[0]!.id,
    memberId: "SVM-TEST01",
    date: "2026-11-16",
    status: "present",
    createdAt: new Date().toISOString(),
  });
  await store.markAttendance({ ...marked, id: "SVA-TEST02", status: "absent" });
  const marks = await store.listAttendance(batches[0]!.id);
  assert.equal(marks.length, 1);
  assert.equal(marks[0]?.status, "absent");
  await store.addFee({
    id: "SVY-TEST01",
    batchId: batches[0]!.id,
    memberId: "SVM-TEST01",
    amount: 5000,
    kind: "cash",
    paidOn: "2026-11-16",
    note: "First instalment",
    createdAt: new Date().toISOString(),
  });
  const fees = await store.listFees();
  assert.equal(fees[0]?.amount, 5000);
  await store.addAssignment({
    id: "SVG-TEST01",
    batchId: batches[0]!.id,
    memberId: "SVM-TEST01",
    title: "SQL practice",
    dueOn: "2026-11-20",
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  const updated = await store.updateAssignment("SVG-TEST01", "reviewed");
  assert.equal(updated?.status, "reviewed");
  await store.addTeacherNote({
    id: "SVT-TEST01",
    batchId: batches[0]!.id,
    body: "Covered joins.",
    createdAt: new Date().toISOString(),
  });
  const notes = await store.listTeacherNotes(batches[0]!.id);
  assert.equal(notes[0]?.body, "Covered joins.");
  await store.addFaculty({
    id: "SVQ-TEST01",
    fullName: "Meera Rao",
    phone: "9845012345",
    email: "meera@example.com",
    course: "data-analyst",
    rate: 1500,
    note: "",
    createdAt: new Date().toISOString(),
  });
  await store.markFacultyDay({
    id: "SVD-TEST01",
    teacherId: "SVQ-TEST01",
    date: "2026-11-16",
    status: "present",
    createdAt: new Date().toISOString(),
  });
  const due = await store.listFacultyPays();
  assert.equal(due.length, 1);
  assert.equal(due[0]?.status, "due");
  assert.equal(due[0]?.amount, 1500);
  await store.markFacultyDay({
    id: "SVD-TEST02",
    teacherId: "SVQ-TEST01",
    date: "2026-11-16",
    status: "absent",
    createdAt: new Date().toISOString(),
  });
  assert.equal((await store.listFacultyPays()).length, 0);
  const saved = await store.saveFacultyPay({
    id: "SVK-TEST01",
    teacherId: "SVQ-TEST01",
    amount: 1500,
    classDate: "2026-11-17",
    paidOn: "",
    status: "due",
    note: "Evening class",
    createdAt: new Date().toISOString(),
  });
  const settled = await store.settleFacultyPay(saved.id, "2026-11-17");
  assert.equal(settled?.status, "paid");
  storeModule.resetStoreForTests();
});
