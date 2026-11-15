import { FileStore } from "@/lib/store/file";
import { PostgresStore } from "@/lib/store/postgres";
import type { LeadStore } from "@/lib/store/types";

const globalStore = globalThis as unknown as { skilVantageStore?: LeadStore };

export function getStore() {
  if (!globalStore.skilVantageStore) {
    globalStore.skilVantageStore = process.env.DATABASE_URL ? new PostgresStore() : new FileStore();
  }
  return globalStore.skilVantageStore;
}

export function resetStoreForTests() {
  globalStore.skilVantageStore = undefined;
}

export type { LeadStore };
