import { deleteCashEntry, patchCashEntry } from "@/lib/handlers/cash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const PATCH = patchCashEntry;
export const DELETE = deleteCashEntry;
