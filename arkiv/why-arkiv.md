# Why Arkiv

## If we swapped Arkiv for Postgres, what would users lose?

1. **A count they can check.** With Postgres the operator holds the votes, and "this story passed" is a claim to trust. On Arkiv each vote is a public entity, and the keeper's decision comes from the same public data. Anyone can recount with `arkiv/query.mts` without asking us.
2. **An expiry nobody can quietly bend.** A story's lifetime is a property of the entity, enforced by the network. An expired entity cannot be revived, so bringing a story back means publishing a new one in public. With Postgres, `expires_at` is a column and a cron job, both controlled by us. On Arkiv we can still extend a story early, but every extension is a visible transaction, and a vote is needed before our keeper makes one.
3. **A feed that other apps can build on.** The stories and votes are public, queryable data. Someone else can build a different reader on the same data, and the data does not disappear if our server does.

## How it compares

| | Queries | Built-in expiry | Needs a server we run | Needs smart contracts |
| --- | --- | --- | --- | --- |
| Postgres plus a cron job | Yes | No, a cron job we run | Yes | No |
| IPFS | No, content is found by hash | No | No | No |
| Smart contract plus a subgraph | Yes, through an indexer | No | The indexer | Yes |
| Arkiv | Yes, on indexed columns | Yes, per entity | Only the keeper | No |

## What we kept off Arkiv, and why

- **Article text.** We store the headline, our own short summary and the link. Full text raises copyright problems and does not need to be on a chain.
- **Voter identity.** The raw cookie id, and later the World ID nullifier, is never stored. A vote carries only a salted hash that is scoped to the story and round, so it cannot be linked across stories. Expiry does not erase an entity's original payload, so anything we wrote would stay readable in history.
- **The RSS inbox.** It is temporary and re-fetched, so it has no reason to be on Arkiv.
- **The voting rule.** Arkiv has no smart contracts, so the rule (at least 300 people and more than half keep) lives in `lib/rules.ts`, which both the interface and the keeper use. It is public code, not an on-chain guarantee.
- **Rate limits and secrets.** These stay in server memory and environment variables.
- **The Faded page.** An expired entity disappears from queries, so showing faded stories would need a tombstone entity. It is planned, not built.

## What Arkiv does not solve for us

Three parts are still trusted: the editor wallet (what gets posted), the relayer wallet (which votes are written), and the keeper (when a story is extended). We reduce the trust instead of removing it. All three act through public transactions, the rule is public code, and anyone can recompute a count. The voter identity is a placeholder cookie for now, so counts can be inflated until World ID verification is in place.

We have not measured storage or gas costs on mainnet.
