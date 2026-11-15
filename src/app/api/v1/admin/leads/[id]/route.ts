import { deleteLead, getLead, patchLead } from "@/lib/handlers/admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = getLead;
export const PATCH = patchLead;
export const DELETE = deleteLead;
