import { getBatches, postBatch } from "@/lib/handlers/batches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = getBatches;
export const POST = postBatch;
