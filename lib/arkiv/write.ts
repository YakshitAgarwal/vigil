import { ExpirationTime } from "@arkiv-network/sdk";
import { u64 } from "@arkiv-network/sdk/schema";
import { stringToBytes, type Address, type Hex } from "viem";
import { editorClient, evmClient } from "./client";
import { findStoryKey } from "./read";
import { StorySchema } from "./schema";

const ROUND = ExpirationTime.fromDays(7);

// One write at a time, so explicit nonces never collide.
let queue: Promise<unknown> = Promise.resolve();
function serialized<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

// Rabdi serves state at the latest block only, and default gas can run out.
async function txFields(address: Address) {
  const [nonce, gasPrice] = await Promise.all([
    evmClient.getTransactionCount({ address, blockTag: "latest" }),
    evmClient.getGasPrice(),
  ]);
  return { nonce, gasPrice, gas: 1_500_000n }; // small entities only
}

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
  return serialized(async () => {
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
  return serialized(async () => {
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
