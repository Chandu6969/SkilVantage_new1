import { Binary, MongoClient } from "mongodb";
import { FileStore } from "@/lib/store/file";

const lists = [
  "registrations",
  "enquiries",
  "followups",
  "events",
  "sessions",
  "batches",
  "learners",
  "removed",
  "attendance",
  "fees",
  "assignments",
  "teacherNotes",
  "teachers",
  "teacherDays",
  "teacherPays",
  "cashEntries",
] as const;

type ListName = (typeof lists)[number];
type Row = Record<string, unknown>;
type MongoDoc = { _id: string; body?: unknown; data?: unknown; [key: string]: unknown };

const globalMongo = globalThis as unknown as { skilVantageMongo?: MongoClient };

function uri() {
  const value = process.env.MONGODB_URI;
  if (!value) throw new Error("MONGODB_URI is not set");
  return value;
}

function client() {
  if (!globalMongo.skilVantageMongo) {
    globalMongo.skilVantageMongo = new MongoClient(uri(), { family: 4, serverSelectionTimeoutMS: 10000 });
  }
  return globalMongo.skilVantageMongo;
}

function database() {
  return client().db(process.env.MONGODB_DB || "skilvantage");
}

function collection(name: string) {
  return database().collection<MongoDoc>(name);
}

function asBuffer(value: unknown) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Binary) return Buffer.from(value.buffer);
  if (value instanceof Uint8Array) return Buffer.from(value);
  return Buffer.alloc(0);
}

function keyFor(name: ListName, row: Row) {
  return String(name === "sessions" ? row.tokenHash : row.id);
}

function withoutId(doc: MongoDoc) {
  const row: Row = { ...doc };
  delete row._id;
  return row;
}

export class MongoStore extends FileStore {
  kind = "mongo" as const;

  protected async loadRaw() {
    const db = database();
    const counts = await Promise.all(lists.map((name) => collection(name).countDocuments()));
    const settings = await collection("settings").countDocuments();
    if (counts.every((count) => count === 0) && settings === 0) {
      const legacy = await collection("desk").findOne({ _id: "store" });
      if (legacy?.body && typeof legacy.body === "object") {
        await this.saveRaw(legacy.body as Parameters<FileStore["saveRaw"]>[0]);
      } else {
        return null;
      }
    }
    const body: Record<string, unknown> = {};
    for (const name of lists) {
      const docs = await collection(name).find().toArray();
      body[name] = docs.map(withoutId);
    }
    const meta = await collection("settings").findOne({ _id: "meta" });
    const cashBook = await collection("settings").findOne({ _id: "cashBook" });
    body.meta = meta ? withoutId(meta) : {};
    body.cashBook = cashBook ? withoutId(cashBook) : undefined;
    const files = await collection("files").find().toArray();
    body.files = files.map((file) => ({
      ...withoutId(file),
      data: asBuffer(file.data).toString("base64"),
    }));
    return JSON.stringify(body);
  }

  protected async saveRaw(body: Parameters<FileStore["saveRaw"]>[0]) {
    const record = body as unknown as Record<ListName | "meta" | "cashBook" | "files", unknown>;
    for (const name of lists) {
      const rows = Array.isArray(record[name]) ? (record[name] as Row[]) : [];
      const table = collection(name);
      const ids = rows.map((row) => keyFor(name, row));
      await table.deleteMany({ _id: { $nin: ids } });
      for (const row of rows) {
        const _id = keyFor(name, row);
        await table.replaceOne({ _id }, { ...row, _id }, { upsert: true });
      }
    }
    await collection("settings").replaceOne({ _id: "meta" }, { _id: "meta", ...(record.meta as Row) }, { upsert: true });
    await collection("settings").replaceOne({ _id: "cashBook" }, { _id: "cashBook", ...(record.cashBook as Row) }, { upsert: true });
    const files = Array.isArray(record.files) ? (record.files as Row[]) : [];
    const fileIds = files.map((file) => String(file.id || "")).filter(Boolean);
    const fileTable = collection("files");
    await fileTable.deleteMany(fileIds.length ? { _id: { $nin: fileIds } } : {});
    for (const file of files) {
      if (!file.id) continue;
      const data = typeof file.data === "string" ? Buffer.from(file.data, "base64") : Buffer.alloc(0);
      const { data: _data, ...meta } = file;
      await fileTable.replaceOne({ _id: String(file.id) }, { ...meta, _id: String(file.id), data }, { upsert: true });
    }
    await collection("desk").deleteMany({});
  }
}
