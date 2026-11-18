import { postCashSync } from "@/lib/handlers/cash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = postCashSync;
