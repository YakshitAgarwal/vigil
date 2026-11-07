import { eq } from "@arkiv-network/sdk/query";
import { str } from "@arkiv-network/sdk/schema";
import { hexToString, type Hex } from "viem";
import { editorAddress, publicClient } from "./client";
import { StorySchema } from "./schema";

const BLOCK_MS = 2000; // Arkiv blocks take 2 seconds

export type ChainStory = {
  key: Hex;
  articleId: string;
  source: string;
  postedAt: number;
  headline: string;
  summary: string;
  url: string;
  expiresAt: number; // approximate, ms since epoch
};

type Body = { headline: string; summary: string; url: string };

function parseBody(hex: Hex): Body | null {
  try {
    const value: unknown = JSON.parse(hexToString(hex));
    if (typeof value === "object" && value !== null) {
      const { headline, summary, url } = value as Record<string, unknown>;
      if (
        typeof headline === "string" &&
        typeof summary === "string" &&
        typeof url === "string"
      ) {
        return { headline, summary, url };
      }
    }
  } catch {
    // not our format, skip it
  }
  return null;
}

function toBigInt(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" || typeof value === "string")
    return BigInt(value);
  if (typeof value === "object" && value !== null && "value" in value) {
    return toBigInt((value as { value: unknown }).value);
  }
  throw new Error("Unexpected number format from Arkiv");
}

export async function findStoryKey(articleId: string): Promise<Hex | null> {
  const { entities } = await publicClient
    .select({ $key: true })
    .from(StorySchema)
    .where(eq("article_id", str(articleId)))
    .ownedBy(editorAddress())
    .limit(1)
    .fetch();
  return entities[0]?.$key ?? null;
}

export async function listStories(): Promise<ChainStory[]> {
  const { currentBlock } = await publicClient.getBlockTiming();
  const { entities } = await publicClient
    .select({
      $key: true,
      $expiresAt: true,
      article_id: true,
      source: true,
      posted_at: true,
      body: true,
    })
    .from(StorySchema)
    .ownedBy(editorAddress())
    .limit(100)
    .fetch();

  const stories: ChainStory[] = [];
  for (const e of entities) {
    const body = parseBody(e.body.value as Hex);
    if (!body) continue;
    const blocksLeft = toBigInt(e.$expiresAt) - currentBlock;
    stories.push({
      key: e.$key,
      articleId: e.article_id.value,
      source: e.source.value,
      postedAt: Number(e.posted_at.value),
      ...body,
      expiresAt: Date.now() + Number(blocksLeft) * BLOCK_MS,
    });
  }
  return stories.sort((a, b) => a.expiresAt - b.expiresAt);
}
