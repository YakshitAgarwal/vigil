import { createHash } from "node:crypto";

export type FeedSource = { name: string; url: string };

export type FeedItem = {
  id: string; // internal only: hash of the link, for de-duplication and React keys
  title: string;
  description: string;
  link: string;
  category: string;
  publishedAt: number; // ms since epoch
  source: string;
};

export class FeedError extends Error {
  constructor(
    public readonly feed: string,
    message: string,
  ) {
    super(`${feed}: ${message}`);
    this.name = "FeedError";
  }
}

export const FEEDS: FeedSource[] = [
  {
    name: "The Hindu (National)",
    url: "https://www.thehindu.com/news/national/feeder/default.rss",
  },
];

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
};

function decode(s: string): string {
  return s
    .replace(/&(?:amp|lt|gt|quot|apos|#39);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) =>
      String.fromCodePoint(parseInt(h, 16)),
    );
}

/** Returns the plain text inside <name>…</name>, or "" if the tag is missing. */
function text(block: string, name: string): string {
  const m = block.match(
    new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"),
  );
  if (!m) return "";
  const raw = m[1].trim();
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  const html = cdata ? cdata[1] : decode(raw);
  return decode(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

export function parseRss(xml: string, source: string): FeedItem[] {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  const items: FeedItem[] = [];

  for (const block of blocks) {
    const title = text(block, "title");
    const description = text(block, "description");
    const link = text(block, "link");
    const category = text(block, "category");
    const publishedAt = Date.parse(text(block, "pubDate"));

    // Skip the item if any required field is missing or unusable.
    if (!title || !description || !category) continue;
    if (!/^https?:\/\//i.test(link)) continue;
    if (Number.isNaN(publishedAt)) continue;

    items.push({
      id: createHash("sha256").update(link).digest("hex").slice(0, 32),
      title,
      description,
      link,
      category,
      publishedAt,
      source,
    });
  }
  return items;
}

export async function fetchFeed(feed: FeedSource): Promise<FeedItem[]> {
  let res: Response;
  try {
    res = await fetch(feed.url, {
      headers: {
        "User-Agent": "VigilBot/0.1 (hackathon project)",
        Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
      },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 300 }, // Next.js caches it for 5 minutes
    });
  } catch (err) {
    throw new FeedError(
      feed.name,
      `request failed (${err instanceof Error ? err.message : "unknown"})`,
    );
  }
  if (!res.ok) throw new FeedError(feed.name, `HTTP ${res.status}`);

  const items = parseRss(await res.text(), feed.name);
  if (items.length === 0) {
    throw new FeedError(
      feed.name,
      "no items found, the feed format may have changed",
    );
  }
  return items;
}

export async function loadInbox(): Promise<{
  items: FeedItem[];
  errors: { feed: string; error: string }[];
}> {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const byId = new Map<string, FeedItem>();
  const errors: { feed: string; error: string }[] = [];

  results.forEach((r, i) => {
    if (r.status === "fulfilled")
      r.value.forEach((item) => byId.set(item.id, item));
    else errors.push({ feed: FEEDS[i].name, error: String(r.reason) });
  });

  const items = [...byId.values()]
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, 50);
  return { items, errors };
}
