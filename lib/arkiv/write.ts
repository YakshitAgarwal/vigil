import { ExpirationTime } from "@arkiv-network/sdk";
import { u64 } from "@arkiv-network/sdk/schema";
import { stringToBytes, type Address, type Hex } from "viem";
import { editorClient } from "./client";
import { findStoryKey } from "./read";
import { StorySchema } from "./schema";
import { createQueue, txFields } from "./tx";
import { LIFETIME } from "@/lib/rules";

const ROUND = ExpirationTime.fromSeconds(Math.round(LIFETIME / 1000));

const editorQueue = createQueue();

export type NewStory = {
  articleId: string;
  source: string;
  postedAt: number;
  headline: string;
  summary: string; // write your own, don't paste the feed snippet
  url: string;
};

export async function postStory(story: NewStory): Promise<{
  entityKey: Hex;
  txHash?: Hex;
  expiresAtBlock?: string;
  duplicate: boolean;
}> {
  const existing = await findStoryKey(story.articleId);
  if (existing) return { entityKey: existing, duplicate: true };

  const { account, wallet } = editorClient();
  return editorQueue(async () => {
    try {
      const tx = await txFields(account.address);
      const result = await wallet.createEntity(
        StorySchema,
        {
          article_id: story.articleId,
          source: story.source,
          posted_at: u64(BigInt(story.postedAt)),
          body: stringToBytes(
            JSON.stringify({
              headline: story.headline,
              summary: story.summary,
              url: story.url,
            }),
          ),
        },
        { expiration: ROUND, flags: { readonly: true } },
        tx,
      );
      return {
        entityKey: result.entityKey,
        txHash: result.txHash,
        expiresAtBlock: String(result.expiresAt),
        duplicate: false,
      };
    } catch (err) {
      throw new Error(
        `createEntity failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  });
}

/** Sets a new 7-day expiry from now. Run this before the story's last day. */
export async function extendStory(entityKey: Hex): Promise<{ txHash: Hex }> {
  const { account, wallet } = editorClient();
  return editorQueue(async () => {
    try {
      const tx = await txFields(account.address);
      const result = await wallet.extendEntity(
        { entityKey, expiration: ROUND },
        tx,
      );
      return { txHash: result.txHash };
    } catch (err) {
      throw new Error(
        `extendEntity failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  });
}
