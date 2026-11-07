# Arkiv feedback

Environment: Rabdi testnet (chain ID 7794095), `@arkiv-network/sdk` [FILL IN: run `npm ls @arkiv-network/sdk`], Node [FILL IN: `node -v`], TypeScript, Next.js 15. Written during ETHGlobal Mumbai 2026.

The first two sections are things that broke for us, with the exact error. The third is things we only worked around and did not reproduce as failures. The fourth is what worked.

## Things that broke

### 1. `getGasPrice` does not exist on the Arkiv public client

**What we expected.** Arkiv's own guidance for Rabdi writes says to pass an explicit nonce, `gasPrice` and `gas`. The SDK README describes itself as a viem replacement with Arkiv's features added, so we expected viem's `getGasPrice` and `getTransactionCount` on the client returned by `createPublicClient`.

**What happened.** TypeScript failed with `Property 'getGasPrice' does not exist on type ...`. We assumed `getTransactionCount` was missing as well and moved both calls to a plain viem client.

**How to reproduce.**

```ts
import { createPublicClient } from "@arkiv-network/sdk";
import { rabdi } from "@arkiv-network/sdk/chains";
import { http } from "viem";

const client = createPublicClient({ chain: rabdi({ accessKey: "" }), transport: http() });
await client.getGasPrice(); // TS2339: Property 'getGasPrice' does not exist
```

**Workaround.** A second client from viem's own `createPublicClient`, using the same chain and transport, only for nonce and gas price.

**Suggestion.** Expose `getGasPrice`, `getTransactionCount` and `estimateGas` on Arkiv's clients, or say in the Rabdi write guidance that a plain viem client is needed.

### 2. A reusable filter helper gives an error that does not name the problem

**What we expected.** To avoid repeating four `eq(...)` filters, we wrote a helper that builds the `and(...)` and takes extra expressions as a rest parameter typed `Expression[]`. We expected either that it would work, or an error saying what is wrong.

**What happened.** TypeScript failed with:

```
Argument of type '[Expression<AttributeRef | ValueRef<"$creator", AddrValue> | ValueRef<"story", KeyValue> | ValueRef<"round", U64Value>>]'
is not assignable to parameter of type 'readonly [Expression<...>] & { ... }'.
  Type '[Expression<...>]' is not assignable to type '{ [x: `"${string}" is not a column of this schema`]: never; }'.
    Index signature for type '`"${string}" is not a column of this schema`' is missing in type '[Expression<...>]'.
```

The message does not say which column is the problem, or that widening the rest parameter to `Expression[]` loses the column names the schema check needs. It took us a while to work out that the helper's type was the cause.

**How to reproduce.** Write `function scope(storyKey: Hex, round: bigint, ...extra: Expression[])` that returns `and(eq("$creator", addr(a)), eq("story", key(storyKey)), eq("round", u64(round)), ...extra)`, then pass its result to `publicClient.count().from(VoteSchema).where(...)`.

**Workaround.** Write each expression inline inside the `where(...)` call.

**Suggestion.** Name the offending column in the message, and add a docs example of a reusable filter that keeps the schema typing, for example a helper typed against the schema.

## Things we worked around

These shaped our design. We did not measure them as failures.

1. **Default writes on Rabdi.** Arkiv's docs issue #92 says default gas and nonce handling can revert on Rabdi, and that reads must use the latest block. We followed the workaround on every write (explicit nonce at `latest`, `gasPrice`, and a fixed `gas` of 1,500,000) and serialized writes per wallet with a queue. The first-entity quickstart does not include this.
2. **128-byte string columns.** Headlines are longer, so we store them as JSON in a `bytes` column and index only short fields. A short guide on what goes in indexed columns and what goes in `bytes` would help.
3. **Expiry is a block number.** We convert it to a countdown by assuming 2 seconds per block. A helper to turn blocks into a date would remove the guess.
4. **No expiry event.** Our keeper has to poll. This is documented. A reference keeper in the docs would help anyone building on expiry.
5. **Counts cost 10 quota units each, and there is no group by.** Each story needs one count for keep and one for fade, so a feed of N stories costs 2N queries per refresh. We added a 5-second server cache.
6. **Expired entities vanish from queries.** A Faded page needs a separate tombstone entity with a longer lifetime. A way to read recently expired entities, or a grace period, would remove that.
7. **Docs and SDK drift.** While building, the API reference sidebar still listed Tiramisu pages, while the guides target Rabdi and SDK 1.0. We could not find the 1.0 `executeBatch` syntax in the docs, so we designed rounds so they do not need an atomic batch.

## What worked well

- **Typed schemas catch mistakes before sending.** A wrong column name or value type fails at compile time.
- **Runtime errors point at the problem.** `InvalidValueError: Invalid u64 value undefined: not a bigint, number or string` led us straight to a missing argument, with the line number.
- **Expiry, `extendEntity` and `readonly` were enough to build the whole product.** We needed no backend database.
- **Filtered `count()` made vote tallies simple.** No indexer was needed.
- **The agent skills in the `Arkiv-Network/skills` repo were accurate** about flags, expiry and query limits.

## What we would add

1. A group-by count, so one query returns keep and fade together.
2. A block-to-date and date-to-block helper in the SDK.
3. A webhook or watch event for "entity about to expire" or "entity expired", for keepers.
4. A docs recipe for the "extend if enough people agree" pattern.
5. A clear answer on whether `count()` supports `.createdBy()`. We used a `$creator` predicate to be safe.
