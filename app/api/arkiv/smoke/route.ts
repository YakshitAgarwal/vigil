import { NextResponse } from "next/server";
import { listStories } from "@/lib/arkiv/read";
import { postStory } from "@/lib/arkiv/write";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const created = await postStory({
      articleId: `smoke-${Date.now()}`,
      source: "Smoke test",
      postedAt: Date.now(),
      headline: "Smoke test story",
      summary: "Written by /api/arkiv/smoke.",
      url: "https://example.com",
    });
    const stories = await listStories();
    return NextResponse.json({
      created,
      explorer: `https://rabdi.explorer.arkiv.network/entity/${created.entityKey}`,
      stories,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
