# Vigil

**News that stays only as long as verified people keep it burning.**

Vigil is a news app where every story has a lifespan. An editor posts a story with a one-week fuse. Readers watch it burn down and vote to keep it or let it fade. If enough people choose to keep it, the story is renewed for another week. If not, it expires and disappears. Stories and votes are stored on [Arkiv](https://arkiv.network), a Web3 database with built-in expiry, so a story's lifetime is a property of the data and not a cron job on our server.

Built at ETHGlobal Mumbai 2026.

## Why it is needed

Most news is read today and forgotten tomorrow. The stories that matter most, such as a water cut that keeps going, a repair that keeps slipping, or a promised review that never meets, fall off the feed long before anything is resolved. What stays visible is decided by an algorithm or an editor's front page, not by the people affected.

Vigil flips that. A story survives only while readers choose to keep it, and the count is public, so anyone can check it instead of trusting us.

## Status

| Part | State |
| --- | --- |
| RSS inbox (The Hindu national feed) and editor page | Built |
| Post a story to Arkiv and read it back | Built |
| Vote relayer: one vote per person per round, live tallies from Arkiv | Built |
| Keeper that renews a passing story | Working |
| World ID verification | Simulated. Votes use a placeholder cookie identity. |
| Faded page (needs tombstone entities) | Not built |

## Features

- **Burn line.** Every story has a fuse that shortens as time passes, with a tick showing when voting closes.
- **Live news inbox.** The editor sees fresh items from an RSS feed and posts any of them with one button. Items missing a title, description, category, link or date are skipped.
- **Anonymous voting.** Readers vote keep or fade without a wallet or gas. One vote per person per round.
- **Public, recountable tallies.** Vote counts are read from Arkiv, and `arkiv/query.mts` recounts them without our server.
- **Automatic renewal.** After voting closes, a keeper extends stories that got at least the quorum and more than half "keep".
- **Fresh vote after each renewal.** A renewed story starts a new, empty round.
- **Demo mode.** Round length and quorum are environment variables, so a week-long vote can be shown in about 10 minutes.

## How it works

```
day 0 ─────────────────────────────── day 6 ───── day 7
posted        voting open             voting       story expires
                                      closes       unless renewed
                                        │
                      keeper counts the votes: at least 300 people and
                      more than half "keep" → extend by another week
```

1. **Ingest.** The editor page reads RSS feeds on the server and lists candidates.
2. **Post.** "Post to Vigil" writes a `vigil.story` entity to Arkiv with a 7-day lifetime. It is `readonly`, so the headline cannot change.
3. **Vote.** A reader's vote goes to our server, which checks the story is open and the person has not voted, then a relayer wallet writes a `vigil.vote` entity. The vote stores only a choice and a salted hash.
4. **Count.** The home page reads stories and filtered vote counts from Arkiv.
5. **Decide.** One day before expiry, voting closes. The keeper reads the final count with the same rule function the interface uses.
6. **Renew or fade.** A passing story is extended with `extendEntity`. A failing one expires on its own.

**Rounds without extra writes.** Each vote carries the story's expiry block as its round id. Extending a story changes that block, so a renewal starts a fresh round automatically.

## Architecture

Arkiv is the only database. The Next.js server holds two wallet keys (editor and relayer) and runs the vote and keeper logic. The browser never sees a key.

| Entity | Written by | Editable | Expires |
| --- | --- | --- | --- |
| `vigil.story` | Editor wallet | No (`readonly`) | One round, extended if the vote passes |
| `vigil.vote` | Relayer wallet | No (`readonly`) | One round after it is written |

Full details are in [`arkiv/schema.md`](arkiv/schema.md).

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Database | [Arkiv](https://arkiv.network) on the Rabdi testnet (chain ID 7794095), through `@arkiv-network/sdk` 1.0 and `viem` |
| News ingestion | A small RSS parser using only the standard library |
| Identity | World ID verification is simulated in this build, and the vote route is built so a verified World ID nullifier can replace the placeholder |
| Keeper | A Next.js route plus a plain Node script, `scripts/keeper-loop.mjs` |

## Project structure

```
app/
  page.tsx, faded/, story/[id]/     Pages
  editor/                           Inbox and post button
  api/
    stories/                        Stories with vote counts, read from Arkiv
    vote/                           Writes a vote through the relayer
    editor/post/                    Writes a story (needs the editor key)
    keeper/                         One keeper pass (needs the keeper key)
    inbox/                          RSS feed items as JSON
    arkiv/smoke/                    Dev-only first write and read
components/                         Burn line, vote meter, story rows, dialogs
lib/
  rules.ts                          Round length, quorum and the renewal rule
  feeds.ts                          RSS fetching and parsing
  keeper.ts                         The keeper pass
  voter.ts, rate-limit.ts, secret.ts
  arkiv/                            Schemas, clients, reads, writes, votes
scripts/keeper-loop.mjs             Calls the keeper on a timer
arkiv/                              Hackathon submission files and the query script
```

## Installation

You need Node 22.10 or later, a free Arkiv access key from the [Arkiv Hub](https://hub.arkiv.network/access-keys), and two test wallets funded with tGLM from the [faucet](https://hub.arkiv.network/faucet): one for the editor, one for the relayer.

```bash
git clone <your-repo-url>
cd vigil
npm install
cp .env.example .env.local   # then fill it in
npm run dev
```

### Environment variables

| Variable | What it is |
| --- | --- |
| `ARKIV_ACCESS_KEY` | Your Arkiv access key |
| `PRIVATE_KEY`, ADDRESS` | Wallet that posts and extends stories |
| `RELAYER_PRIVATE_KEY`, `RELAYER_ADDRESS` | A different wallet that writes votes |
| `VOTER_SALT` | A long random string used to hash voter ids |
| `EDITOR_SECRET` | The key you type on the Inbox page to post |
| `KEEPER_SECRET` | The key the keeper script uses |
| `NEXT_PUBLIC_ROUND_MINUTES` | Optional demo round length in whole minutes (at least 4). Default is 7 days |
| `NEXT_PUBLIC_QUORUM` | Optional demo quorum. Default is 300 |

Restart the dev server after changing any of these.

### Try it

1. Open `/editor`, type your editor key, and press "Post to Vigil" on a story.
2. Open the home page and vote on it.
3. Run the keeper in a second terminal: `node --env-file=.env.local scripts/keeper-loop.mjs`. Add `--dry` to see its decisions without sending a transaction.

Demo mode (`NEXT_PUBLIC_ROUND_MINUTES=10`, `NEXT_PUBLIC_QUORUM=3`) gives 10-minute rounds with a quorum of 3. Voting closes after about 8.5 minutes. Each private browser window counts as a separate demo voter.

## Verify on Arkiv

Network: Rabdi testnet, chain ID 7794095.

| Role | Address | Wrote |
| --- | --- | --- |
| Editor | [FILL IN: EDITOR_ADDRESS] | `vigil.story` entities and their extensions |
| Relayer | [FILL IN: RELAYER_ADDRESS] | `vigil.vote` entities |

Example entity: [FILL IN: https://rabdi.explorer.arkiv.network/entity/YOUR_ENTITY_KEY]

**One query you can run.** `arkiv/query.mts` lists every live story, how long it has left, and its keep and fade counts for the current round, straight from Arkiv:

```bash
ARKIV_ACCESS_KEY=your_key \
EDITOR_ADDRESS=[FILL IN: EDITOR_ADDRESS] \
RELAYER_ADDRESS=[FILL IN: RELAYER_ADDRESS] \
node --experimental-strip-types arkiv/query.mts
```

Stories expire, so if nothing is listed, they have faded. [FILL IN: a story key that is live while judging, or a note saying when to expect one.]

## Known limitations

- **Voter identity is a placeholder.** Clearing cookies gives a new identity and another vote, so counts can be inflated until real World ID verification is in. The rate limiter only protects the relayer's balance.
- **Single instance.** The keeper lock and rate limiter live in server memory, so run one server.
- **Three trusted parts.** The editor wallet, the relayer wallet and the keeper are trusted. All of them act through public transactions and the renewal rule is public code, so anyone can recompute a count.
- **No Faded page yet.** Expired entities vanish from Arkiv queries, so a Faded page needs a tombstone entity with a longer lifetime.
- **Text in short rounds.** Some interface text still says "7 days" and "1 day left" in demo mode.