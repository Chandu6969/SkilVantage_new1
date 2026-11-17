import { deleteMember, patchMember } from "@/lib/handlers/batches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = patchMember;
export const DELETE = deleteMember;
