import { Binary, MongoClient, type Document } from "mongodb";
import { FileStore } from "@/lib/store/file";

const globalMongo = globalThis as unknown as { skilVantageMongo?: MongoClient };

function uri() {
  const value = process.env.MONGODB_URI;
  if (!value) throw new Error("MONGODB_URI is not set");
  return value;
}

function client() {
  if (!globalMongo.skilVantageMongo) globalMongo.skilVantageMongo = new MongoClient(uri());
  return globalMongo.skilVantageMongo;
}

function database() {
  return client().db(process.env.MONGODB_DB || "skilvantage");
}

function asBuffer(value: unknown) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Binary) return Buffer.from(value.buffer);
  if (value instanceof Uint8Array) return Buffer.from(value);
  return Buffer.alloc(0);
}

type StoredFileDoc = { id: string; data?: string };
type DeskDoc = { _id: string; body?: { files?: StoredFileDoc[] }; updatedAt?: Date };

export class MongoStore extends FileStore {
  kind = "mongo" as const;

  protected async loadRaw() {
    const doc = await database().collection<DeskDoc>("desk").findOne({ _id: "store" });
    if (!doc?.body || typeof doc.body !== "object") return null;
    const body = doc.body as { files?: StoredFileDoc[] };
    const files = Array.isArray(body.files) ? body.files : [];
    if (files.length > 0) {
      const stored = await database().collection<Document>("files").find({ id: { $in: files.map((file) => file.id) } }).toArray();
      const bytes = new Map(stored.map((file) => [String(file.id), asBuffer(file.data)]));
      body.files = files.map((file) => ({
        ...file,
        data: bytes.has(file.id) ? bytes.get(file.id)!.toString("base64") : file.data || "",
      }));
    }
    return JSON.stringify(body);
  }

  protected async saveRaw(body: { files?: StoredFileDoc[] }) {
    const files = Array.isArray(body.files) ? body.files : [];
    const kept = files.map((file) => file.id).filter(Boolean);
    const fileCollection = database().collection<Document>("files");
    await fileCollection.deleteMany(kept.length ? { id: { $nin: kept } } : {});
    for (const file of files) {
      if (!file.id || !file.data) continue;
      await fileCollection.updateOne(
        { id: file.id },
        { $set: { id: file.id, data: Buffer.from(file.data, "base64") } },
        { upsert: true },
      );
    }
    const stored = {
      ...body,
      files: files.map(({ data: _data, ...meta }) => meta),
    };
    await database().collection<DeskDoc>("desk").updateOne(
      { _id: "store" },
      { $set: { body: stored, updatedAt: new Date() } },
      { upsert: true },
    );
  }
}
