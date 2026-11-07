import { NextResponse } from "next/server";
import { listStories } from "@/lib/arkiv/read";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ stories: await listStories() });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Couldn’t read stories from Arkiv" },
      { status: 502 },
    );
  }
}
