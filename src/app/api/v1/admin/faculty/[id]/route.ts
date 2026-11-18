import { deleteFaculty, patchFaculty } from "@/lib/handlers/faculty";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = patchFaculty;
export const DELETE = deleteFaculty;
