# How we use Arkiv

Two questions to answer. Do what we filter on, who can edit each entity and when it expires fit what the app does? And does each Arkiv feature change something a user sees?

The full entity design is in [`schema.md`](schema.md).

## Do the filters, editing rules and expiry fit the app?

| Entity | What we filter on | Who can write | Who can edit | Expires | Why this fits |
| --- | --- | --- | --- | --- | --- |
| `vigil.story` | Owner (the editor wallet), `article_id` | Editor wallet | Nobody (`readonly`) | One round, then extended only if the vote passes | A story's lifetime is the product. Readonly means the headline voters read is the one that was posted. Only the owner can extend, so nobody can override the vote. |
| `vigil.vote` | `$creator` (relayer), `story`, `round`, `choice`, `voter` | Relayer wallet | Nobody (`readonly`) | One round after it is written | Each filter column is something a user-facing question depends on: whose votes count, which story, which round, keep or fade, and has this person already voted. |

Choices we made on purpose:

- **Permissionless extension is off.** With it on, anyone could extend a story the readers had voted to fade.
- **Every read is scoped to a trusted writer.** Anyone can write an entity under our schema name. Stories are filtered by owner and votes by `$creator`, so a stranger's entities never reach the feed or the count.
- **`round` is the story's expiry block.** The round changes when the story is renewed, which gives a fresh vote.
- **Headline and summary are in a `bytes` column,** because string columns are limited to 128 bytes and we never filter on them.

One imperfection: votes live for a full round even though they are only needed until voting closes and a short recount window. That costs a little extra storage and keeps the count checkable.

## Does each feature change something users see?

| Arkiv feature | What a user sees |
| --- | --- |
| Entity expiration | The burn line on every story and its countdown. A story that is not renewed disappears from the feed. |
| `extendEntity` (called by the keeper) | A renewed story's burn line refills and voting reopens. |
| Indexed attributes and filtered `count()` | The keep and fade bar and "N more people needed to vote" on every story, read from Arkiv. |
| `$creator` scoping | Votes written by anyone but the relayer do not change the bars. |
| `readonly` | The headline and summary of a story cannot change after it is posted. |
| Queries on `article_id` | The editor page shows "Already on Vigil" instead of letting you post a story twice. |
| Queries on `voter` and `round` | "You already voted on this story", and a renewed story lets you vote again. |
| Reads from Arkiv | The whole home page, the story page and the keeper's decisions come from Arkiv. There is no other database. |

How to check it yourself: run `arkiv/query.mts` (see the README). It reads the same data without our server.
