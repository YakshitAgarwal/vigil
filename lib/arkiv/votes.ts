import { ExpirationTime } from "@arkiv-network/sdk";
import { and, eq } from "@arkiv-network/sdk/query";
import { addr, key, str, u64 } from "@arkiv-network/sdk/schema";
import type { Hex } from "viem";
import { LIFETIME } from "@/lib/rules";
import { publicClient, relayerAddress, relayerClient } from "./client";
import { VoteSchema } from "./schema";
import { createQueue, txFields } from "./tx";

export type Choice = "keep" | "fade";

// Outlives the round, so the count can be rechecked after voting closes.
const VOTE_LIFETIME = ExpirationTime.fromSeconds(Math.round(LIFETIME / 1000));
const relayerQueue = createQueue();

// Only votes written by the relayer count.
const byRelayer = () => eq("$creator", addr(relayerAddress()));

/** `round` is the story's expiry block, which changes whenever the story is renewed. */
export async function tally(
  storyKey: Hex,
  round: bigint,
): Promise<{ keep: number; fade: number }> {
  const [keep, fade] = await Promise.all(
    (["keep", "fade"] as const).map((choice) =>
      publicClient
        .count()
        .from(VoteSchema)
        .where(
          and(
            byRelayer(),
            eq("story", key(storyKey)),
            eq("round", u64(round)),
            eq("choice", str(choice)),
          ),
        )
        .fetch(),
    ),
  );
  return { keep: Number(keep), fade: Number(fade) };
}

export async function findVote(
  storyKey: Hex,
  voter: string,
  round: bigint,
): Promise<Choice | null> {
  const { entities } = await publicClient
    .select({ choice: true })
    .from(VoteSchema)
    .where(
      and(
        byRelayer(),
        eq("story", key(storyKey)),
        eq("round", u64(round)),
        eq("voter", str(voter)),
      ),
    )
    .limit(1)
    .fetch();
  const choice = entities[0]?.choice.value;
  return choice === "keep" || choice === "fade" ? choice : null;
}

export async function castVote(args: {
  storyKey: Hex;
  round: bigint;
  voter: string;
  choice: Choice;
}): Promise<{ ok: true; txHash: Hex } | { ok: false; existing: Choice }> {
  const { account, wallet } = relayerClient();

  return relayerQueue(async () => {
    // Checked inside the queue so two quick requests from one person can't both pass.
    const existing = await findVote(args.storyKey, args.voter, args.round);
    if (existing) return { ok: false as const, existing };

    try {
      const tx = await txFields(account.address);
      const result = await wallet.createEntity(
        VoteSchema,
        {
          story: key(args.storyKey),
          round: u64(args.round),
          choice: args.choice,
          voter: args.voter,
        },
        { expiration: VOTE_LIFETIME, flags: { readonly: true } },
        tx,
      );
      return { ok: true as const, txHash: result.txHash };
    } catch (err) {
      throw new Error(
        `createEntity (vote) failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  });
}
