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

const globalMongo = globalThis as unknown as {
  skilVantageMongo?: MongoClient;
  skilVantageMongoCache?: { version: number; json: string | null };
};

let version = 0;

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
    const seen = version;
    const cached = globalMongo.skilVantageMongoCache;
    if (cached && cached.version === seen) return cached.json;
    const json = await this.fetchAll();
    if (version === seen) globalMongo.skilVantageMongoCache = { version, json };
    return globalMongo.skilVantageMongoCache?.version === version ? globalMongo.skilVantageMongoCache.json : json;
  }

  private async fetchAll() {
    const [rows, settings, files, legacy] = await Promise.all([
      Promise.all(lists.map((name) => collection(name).find().toArray())),
      collection("settings").find().toArray(),
      collection("files").find().toArray(),
      collection("desk").findOne({ _id: "store" }),
    ]);
    if (rows.every((docs) => docs.length === 0) && settings.length === 0) {
      if (legacy?.body && typeof legacy.body === "object") {
        await this.saveRaw(legacy.body as Parameters<FileStore["saveRaw"]>[0]);
        return JSON.stringify(legacy.body);
      }
      return null;
    }
    const body: Record<string, unknown> = {};
    lists.forEach((name, index) => {
      body[name] = rows[index].map(withoutId);
    });
    const meta = settings.find((doc) => doc._id === "meta");
    const cashBook = settings.find((doc) => doc._id === "cashBook");
    body.meta = meta ? withoutId(meta) : {};
    body.cashBook = cashBook ? withoutId(cashBook) : undefined;
    body.files = files.map((file) => ({
      ...withoutId(file),
      data: asBuffer(file.data).toString("base64"),
    }));
    return JSON.stringify(body);
  }

  protected async saveRaw(body: Parameters<FileStore["saveRaw"]>[0]) {
    const record = body as unknown as Record<ListName | "meta" | "cashBook" | "files", unknown>;
    const previous: Record<string, unknown> | null = globalMongo.skilVantageMongoCache?.json
      ? JSON.parse(globalMongo.skilVantageMongoCache.json) as Record<string, unknown>
      : null;
    const changed = (name: keyof typeof record) => !previous || JSON.stringify(previous[name] ?? null) !== JSON.stringify(record[name] ?? null);
    for (const name of lists) {
      if (!changed(name)) continue;
      const rows = Array.isArray(record[name]) ? (record[name] as Row[]) : [];
      const table = collection(name);
      const ids = rows.map((row) => keyFor(name, row));
      if (rows.length) {
        await table.bulkWrite(rows.map((row) => {
          const _id = keyFor(name, row);
          return { replaceOne: { filter: { _id }, replacement: { ...row, _id }, upsert: true } };
        }));
      }
      await table.deleteMany({ _id: { $nin: ids } });
    }
    if (changed("meta")) await collection("settings").replaceOne({ _id: "meta" }, { _id: "meta", ...(record.meta as Row) }, { upsert: true });
    if (changed("cashBook")) await collection("settings").replaceOne({ _id: "cashBook" }, { _id: "cashBook", ...(record.cashBook as Row) }, { upsert: true });
    const files = Array.isArray(record.files) ? (record.files as Row[]) : [];
    if (!changed("files")) {
      version += 1;
      globalMongo.skilVantageMongoCache = { version, json: JSON.stringify(body) };
      return;
    }
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
    version += 1;
    globalMongo.skilVantageMongoCache = { version, json: JSON.stringify(body) };
  }
}
