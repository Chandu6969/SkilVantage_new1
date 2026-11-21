import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { csvCell } from "../src/lib/text";
import { sniffResume } from "../src/lib/security";
import { studentSchema } from "../src/lib/validation";

test("student schema accepts a complete registration and rejects missing consent", () => {
  const base = {
    learnerType: "student",
    program: "data-analyst",
    fullName: "Meera Iyer",
    gender: "Female",
    phone: "9876543210",
    email: "Meera@Example.com",
    city: "Bengaluru",
    state: "Karnataka",
    college: "Sample Institute",
    degree: "B.Tech",
    branch: "Information Technology",
    passedOutYear: "Still studying",
    currentYear: "3rd year",
    skills: "Excel basics",
    programmingLanguages: "None yet",
    tools: "Excel",
    projects: "None yet",
    certifications: "None",
    preferredTrack: "data-analyst",
    expectedPackage: "Not sure yet",
    preferredRole: "Junior Data Analyst",
    opportunity: "Internship",
    learningMode: "Online",
    availability: "Weekends",
    source: "College",
    linkedin: "",
    github: "",
    consent: true,
  };
  const parsed = studentSchema.safeParse(base);
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.email, "meera@example.com");
  const refused = studentSchema.safeParse({ ...base, consent: false });
  assert.equal(refused.success, false);
});

test("csv cells neutralise spreadsheet formulas", () => {
  assert.equal(csvCell("=CMD()"), "'=CMD()");
  assert.equal(csvCell('hello "team"'), '"hello ""team"""');
});

test("resume sniff accepts a small pdf and rejects a renamed text file", () => {
  const pdf = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");
  assert.equal(sniffResume("resume.pdf", "application/pdf", pdf).ok, true);
  assert.equal(sniffResume("resume.pdf", "application/pdf", Buffer.from("not a pdf")).ok, false);
});

test("registrations persist on the server and are not only kept in the browser", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "skilvantage-"));
  const previous = process.env.DATABASE_URL;
  const previousMongo = process.env.MONGODB_URI;
  const previousData = process.env.DATA_DIR;
  delete process.env.DATABASE_URL;
  delete process.env.MONGODB_URI;
  process.env.DATA_DIR = dir;
  try {
    const storeModule = await import("../src/lib/store/index");
    storeModule.resetStoreForTests();
    const { registrationFromInput } = await import("../src/lib/records");
    const input = studentSchema.parse({
      learnerType: "student",
      program: "generative-ai",
      fullName: "Asha Menon",
      gender: "Female",
      phone: "9876501234",
      email: "asha@example.com",
      city: "Kochi",
      state: "Kerala",
      college: "Sample College",
      degree: "B.Sc",
      branch: "Computer Science",
      passedOutYear: "2025",
      currentYear: "Graduated",
      skills: "Python basics",
      programmingLanguages: "Python",
      tools: "Git",
      projects: "A small notes app",
      certifications: "None",
      preferredTrack: "generative-ai",
      expectedPackage: "Not sure yet",
      preferredRole: "GenAI Developer",
      opportunity: "Job",
      learningMode: "Hybrid",
      availability: "Weekday evenings",
      source: "LinkedIn",
      linkedin: "https://www.linkedin.com/in/example",
      github: "",
      consent: true,
    });
    const record = registrationFromInput(input, null);
    const store = storeModule.getStore();
    await store.insertRegistration(record);
    storeModule.resetStoreForTests();
    const again = storeModule.getStore();
    const saved = await again.getRegistration(record.id);
    assert.ok(saved);
    assert.equal(saved?.email, "asha@example.com");
    assert.equal(saved?.sample, false);
    assert.equal(again.kind, "file");
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
    if (previousMongo === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previousMongo;
    if (previousData === undefined) delete process.env.DATA_DIR;
    else process.env.DATA_DIR = previousData;
    await rm(dir, { recursive: true, force: true });
  }
});
