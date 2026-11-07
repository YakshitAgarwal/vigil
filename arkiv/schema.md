# Schema

Vigil stores two kinds of entities on Arkiv's Rabdi testnet (chain ID 7794095), written with `@arkiv-network/sdk` 1.0. The code is in `lib/arkiv/schema.ts`. A third kind, a "tombstone" that would feed the Faded page, is planned and not built.

All the lifetimes below use one round length: 7 days by default, or `NEXT_PUBLIC_ROUND_MINUTES` minutes in demo mode.

## `vigil.story`

One entity per news story.

| Column | Type | Indexed | Holds |
| --- | --- | --- | --- |
| `article_id` | str | yes | SHA-256 of the article URL, first 32 hex characters |
| `source` | str | yes | Feed name, for example "The Hindu (National)" |
| `posted_at` | u64 | yes | Publication time of the article, in ms |
| `body` | bytes | no | JSON `{ "headline", "summary", "url" }` |

- **Written by:** the editor wallet (`EDITOR_ADDRESS`).
- **Owner:** the editor wallet. Ownership is never transferred.
- **Flags:** `readonly: true`. `permissionlessExtension` is off, because it would let anyone extend a story the readers voted to fade.
- **Who can edit it:** nobody. The owner could still delete a readonly entity, and the app never does.
- **Who can extend it:** only the owner. The keeper calls `extendEntity` with the editor wallet.
- **Expires:** one round after creation. When a story passes its vote, the keeper extends it, and the new expiry is one round from that moment. The expiry is the story's lifetime in the app.

Queries on stories:

| Query | Used for |
| --- | --- |
| `from(StorySchema).ownedBy(EDITOR_ADDRESS)` selecting `$key`, `$expiresAt`, `article_id`, `source`, `posted_at`, `body` | The home page feed, the keeper, and the vote route |
| `where(eq("article_id", str(id))).ownedBy(EDITOR_ADDRESS).limit(1)` | The editor page and the post route, to avoid posting a story twice |

## `vigil.vote`

One entity per vote.

| Column | Type | Indexed | Holds |
| --- | --- | --- | --- |
| `story` | key | yes | Key of the story entity |
| `round` | u64 | yes | The story's `$expiresAt` block when the vote was cast |
| `choice` | str | yes | `"keep"` or `"fade"` |
| `voter` | str | yes | `0x` plus SHA-256 of `VOTER_SALT:storyKey:round:identity` |

- **Written by:** the relayer wallet (`RELAYER_ADDRESS`), a different wallet from the editor. Voters need no wallet or gas.
- **Owner:** the relayer wallet.
- **Flags:** `readonly: true`.
- **Who can edit or extend it:** nobody. Votes are never extended.
- **Expires:** one round after the vote is written, so a vote outlives its voting window and the count can be rechecked after voting closes.

Queries on votes (every one is scoped to the relayer with `eq("$creator", addr(RELAYER_ADDRESS))`, because anyone can write entities that use our schema name):

| Query | Used for |
| --- | --- |
| `count().from(VoteSchema).where(creator, story, round, choice)` | The keep and fade bars on every story, and the keeper's decision |
| `select({ choice }).from(VoteSchema).where(creator, story, round, voter).limit(1)` | One vote per person per round |

### Why `round` is the story's expiry block

Extending a story changes its `$expiresAt`, so votes from the previous round no longer match the story's current round. A renewal starts a fresh, empty vote with no extra entity and no atomic batch.

### What is not stored

- The raw identity of a voter. Today that is a random cookie id. With World ID it will be a nullifier. Only a salted hash goes on Arkiv, because expiry does not erase an entity's original payload.
- Article text. We store the headline, a short summary, and the link.
