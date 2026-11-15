import { getSheets, postSheets } from "@/lib/handlers/admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = getSheets;
export const POST = postSheets;
