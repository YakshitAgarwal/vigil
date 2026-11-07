/**
 * Reads Vigil's data straight from Arkiv, without our server.
 * For every story the editor wallet owns, it prints how long the story has left
 * and how many keep and fade votes the relayer wallet wrote for the current round.
 *
 * Run (Node 22.10 or later, after `npm install`):
 *   ARKIV_ACCESS_KEY=... EDITOR_ADDRESS=0x... RELAYER_ADDRESS=0x... \
 *   node --experimental-strip-types arkiv/query.mts
 */
import { createPublicClient } from "@arkiv-network/sdk";
import { rabdi } from "@arkiv-network/sdk/chains";
import { and, eq } from "@arkiv-network/sdk/query";
import { addr, bytes, defineSchema, key, str, u64 } from "@arkiv-network/sdk/schema";
import { hexToString, http, isAddress } from "viem";
import type { Address, Hex } from "viem";

// Same schemas as lib/arkiv/schema.ts.
const StorySchema = defineSchema("vigil.story", {
  article_id: str().indexed(),
  source: str().indexed(),
  posted_at: u64().indexed(),
  body: bytes(),
});

const VoteSchema = defineSchema("vigil.vote", {
  story: key().indexed(),
  round: u64().indexed(),
  choice: str().indexed(),
  voter: str().indexed(),
});

const BLOCK_SECONDS = 2;

function envAddress(name: string): Address {
  const value = process.env[name];
  if (!value || !isAddress(value)) {
    throw new Error(`Set ${name} to a valid address (see the README).`);
  }
  return value;
}

function toBigInt(value: unknown): bigint {
  if (typeof value === "object" && value !== null && "value" in value) {
    return toBigInt((value as { value: unknown }).value);
  }
  return BigInt(value as string | number | bigint);
}

function headlineOf(bodyHex: Hex): string {
  try {
    const parsed: unknown = JSON.parse(hexToString(bodyHex));
    const headline = (parsed as { headline?: unknown } | null)?.headline;
    return typeof headline === "string" ? headline : "(unreadable body)";
  } catch {
    return "(unreadable body)";
  }
}

async function main(): Promise<void> {
  const editor = envAddress("EDITOR_ADDRESS");
  const relayer = envAddress("RELAYER_ADDRESS");

  const client = createPublicClient({
    chain: rabdi({ accessKey: process.env.ARKIV_ACCESS_KEY ?? "" }),
    transport: http(),
  });

  const { currentBlock } = await client.getBlockTiming();

  // Stories: entities in the vigil.story schema that the editor wallet owns.
  const { entities } = await client
    .select({ $key: true, $expiresAt: true, body: true })
    .from(StorySchema)
    .ownedBy(editor)
    .limit(100)
    .fetch();

  if (entities.length === 0) {
    console.log("No live stories. Stories expire, so post a new one and run this again.");
    return;
  }

  for (const story of entities) {
    const expiresAt = toBigInt(story.$expiresAt);

    // Votes: only entities the relayer wallet created count. The round is the story's
    // expiry block, which changes whenever the story is renewed.
    const [keep, fade] = await Promise.all(
      (["keep", "fade"] as const).map((choice) =>
        client
          .count()
          .from(VoteSchema)
          .where(
            and(
              eq("$creator", addr(relayer)),
              eq("story", key(story.$key)),
              eq("round", u64(expiresAt)),
              eq("choice", str(choice)),
            ),
          )
          .fetch(),
      ),
    );

    const minutesLeft = Number((expiresAt - currentBlock) * BigInt(BLOCK_SECONDS)) / 60;
    console.log(story.$key);
    console.log(`  ${headlineOf(story.body.value as Hex)}`);
    console.log(`  expires at block ${expiresAt} (about ${minutesLeft.toFixed(1)} minutes left)`);
    console.log(`  votes this round: ${keep} keep, ${fade} fade\n`);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
