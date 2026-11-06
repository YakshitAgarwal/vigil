/**
 * Where Arkiv plugs in. Nothing here talks to the network yet.
 *
 * Entity design:
 *   story   readonly, owner-only extension (do not enable permissionless
 *           extension, it would let anyone override the vote).
 *           attrs: schema="story", id, source. payload: headline,
 *           summary, url, contentHash. Created by an allowlisted wallet.
 *   update  readonly. attrs: schema="update", story_key, kind.
 *   vote    readonly. attrs: schema="vote", story_key, round, choice,
 *           voter (hashed nullifier). Written by a relayer wallet only
 *           after the World ID proof verifies.
 *   tombstone  written when a story fades, with a longer lifetime, so the
 *           Faded page still has something to read (expired entities
 *           disappear from queries).
 *
 * Attribute names must be lowercase. Scope every read to the allowlisted
 * creator wallets, because anyone can write entities with your labels.
 * Use webSocket() for live updates and set expiry with absolute blocks.
 */
import { hydrateStories } from "./stories";
import type { Story } from "./types";

export async function listStories(now: number): Promise<Story[]> {
  // TODO: replace with an Arkiv query for story entities from trusted creators.
  return hydrateStories(now);
}
