import { NextResponse } from "next/server";
import { loadInbox } from "@/lib/feeds";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await loadInbox());
}
