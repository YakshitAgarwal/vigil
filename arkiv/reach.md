# Reach

## Who is it for, and would they use it?

**Readers of local and civic news.** Stories about a water cut that keeps going, a repair that keeps slipping, or a promised review that never meets tend to fall off the feed before they are resolved. Vigil lets these readers decide which stories deserve to stay visible.

**Editors, local newsrooms and civic watchdogs.** They get a public signal of which unresolved stories people still care about, and a recountable record of it.

Would they use it? We have not tested Vigil with real readers yet. [FILL IN: what happened when you showed it at the hackathon, such as who tried it and what they said. If nobody did, delete this line and keep the one above.]

What we would measure first:

- How many people vote on a story in its first day.
- What share of stories get renewed.
- How many readers come back to vote again on a renewed story.

## Can they try it today?

[FILL IN: a live URL if you have deployed it. If not, say so plainly.]

They can run it locally in a few minutes. The steps are in the [README](../README.md). They need Node 22.10 or later, a free Arkiv access key, and two wallets funded from the faucet.

Known limits of the current build:

- World ID verification is simulated. Identity is a placeholder cookie, so counts can be inflated until verification is real.
- It reads one news feed, and the editor posts stories by hand.
- Demo mode uses 10-minute rounds and a quorum of 3. The real settings are 7 days and 300 people.

## Will we keep building after Mumbai?

[FILL IN: yes or no, and who will work on it. Judges are asking for a straight answer here.]

If we continue, the next steps, in order, are:

1. Real World ID verification, so each person gets one vote.
2. Tombstone entities for the Faded page.
3. Several news feeds, with a queue for the editor instead of posting one story at a time.
4. A visible history of renewals on each story.
5. A check of Arkiv costs on mainnet, which we have not done.
