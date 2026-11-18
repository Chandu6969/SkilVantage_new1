import { deleteBatch, getBatch, patchBatch } from "@/lib/handlers/batches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = getBatch;
export const PATCH = patchBatch;
export const DELETE = deleteBatch;
