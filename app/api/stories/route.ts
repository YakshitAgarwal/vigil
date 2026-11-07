import { NextResponse } from "next/server";
import { listStories } from "@/lib/arkiv/read";
import { tally } from "@/lib/arkiv/votes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_MS = 5_000;
let cache: { at: number; body: unknown } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_MS)
    return NextResponse.json(cache.body);
  try {
    const stories = await listStories();
    const withVotes = await Promise.all(
      stories.map(async (s) => ({
        ...s,
        ...(await tally(s.key, BigInt(s.expiresAtBlock))),
      })),
    );
    const body = { stories: withVotes };
    cache = { at: Date.now(), body };
    return NextResponse.json(body);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Couldn’t read stories from Arkiv" },
      { status: 502 },
    );
  }
}
