import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { postStory } from "@/lib/arkiv/write";
import { loadInbox } from "@/lib/feeds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorised(req: Request): boolean {
  const expected = process.env.EDITOR_SECRET;
  const given = req.headers.get("x-editor-key");
  if (!expected || !given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > 0 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

export async function POST(req: Request) {
  if (!authorised(req)) {
    return NextResponse.json(
      { error: "Wrong or missing editor key" },
      { status: 401 },
    );
  }

  let data: unknown;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const articleId = (data as { articleId?: unknown } | null)?.articleId;
  if (typeof articleId !== "string") {
    return NextResponse.json(
      { error: "articleId is required" },
      { status: 400 },
    );
  }

  // Everything comes from the feed, not from the browser.
  const { items } = await loadInbox();
  const item = items.find((i) => i.id === articleId);
  if (!item) {
    return NextResponse.json(
      { error: "That item is no longer in the inbox" },
      { status: 404 },
    );
  }

  try {
    const result = await postStory({
      articleId: item.id,
      source: item.source,
      postedAt: item.publishedAt,
      headline: item.title,
      summary: truncate(item.description, 600),
      url: item.link,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("postStory failed", err);
    return NextResponse.json(
      {
        error:
          "Couldn’t write to Arkiv. Check the wallet balance and try again.",
      },
      { status: 502 },
    );
  }
}
