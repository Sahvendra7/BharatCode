import { handleCheck } from "@/lib/server/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export function POST(req: Request) {
  return handleCheck(req);
}
