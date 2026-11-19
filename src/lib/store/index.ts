import { FileStore } from "@/lib/store/file";
import { PostgresStore } from "@/lib/store/postgres";
import type { LeadStore } from "@/lib/store/types";

const globalStore = globalThis as unknown as { skilVantageStore?: LeadStore };

function createStore() {
  return process.env.DATABASE_URL ? new PostgresStore() : new FileStore();
}

export function getStore() {
  const current = globalStore.skilVantageStore;
  if (!current || typeof current.clearAttendance !== "function" || typeof current.deleteFee !== "function") {
    globalStore.skilVantageStore = createStore();
  }
  return globalStore.skilVantageStore;
}

export function resetStoreForTests() {
  globalStore.skilVantageStore = undefined;
}

export type { LeadStore };
