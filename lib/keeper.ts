import { listStories } from "@/lib/arkiv/read";
import { tally } from "@/lib/arkiv/votes";
import { extendStory } from "@/lib/arkiv/write";
import {
  QUORUM,
  VOTING_CLOSES_WHEN_LEFT,
  tally as evaluate,
} from "@/lib/rules";

export type KeeperAction = {
  articleId: string;
  headline: string;
  action: "waiting" | "renewed" | "would-renew" | "fading" | "error";
  keep?: number;
  fade?: number;
  /** Seconds until voting closes, for stories that are still open. */
  closesInSeconds?: number;
  detail?: string;
};

export class KeeperBusyError extends Error {
  constructor() {
    super("A keeper pass is already running");
    this.name = "KeeperBusyError";
  }
}

// One pass at a time in this process, so two runs can't extend the same story twice.
let running = false;

async function secondsLeft(articleId: string): Promise<number | null> {
  const story = (await listStories()).find((s) => s.articleId === articleId);
  return story ? Math.round((story.expiresAt - Date.now()) / 1000) : null;
}

export async function runKeeper(options: {
  dryRun: boolean;
}): Promise<KeeperAction[]> {
  if (running) throw new KeeperBusyError();
  running = true;
  try {
    const stories = await listStories();
    const actions: KeeperAction[] = [];

    for (const story of stories) {
      const base = { articleId: story.articleId, headline: story.headline };
      const left = story.expiresAt - Date.now();

      // Voting is still open, nothing to decide yet.
      if (left > VOTING_CLOSES_WHEN_LEFT) {
        actions.push({
          ...base,
          action: "waiting",
          closesInSeconds: Math.round((left - VOTING_CLOSES_WHEN_LEFT) / 1000),
        });
        continue;
      }

      try {
        const votes = await tally(story.key, BigInt(story.expiresAtBlock));
        const verdict = evaluate({ ...votes, quorum: QUORUM });

        if (!verdict.passing) {
          actions.push({
            ...base,
            ...votes,
            action: "fading",
            detail: verdict.quorumMet
              ? "Not enough people kept it"
              : `Only ${verdict.total} of the ${QUORUM} people needed voted`,
          });
          continue;
        }

        if (options.dryRun) {
          actions.push({ ...base, ...votes, action: "would-renew" });
          continue;
        }

        const { txHash } = await extendStory(story.key);
        // Check that the expiry really moved, so a silent failure can't look like success.
        const after = await secondsLeft(story.articleId);
        actions.push({
          ...base,
          ...votes,
          action: "renewed",
          detail: `${txHash}, ${after === null ? "story not found afterwards" : `${after}s left now`}`,
        });
      } catch (err) {
        actions.push({
          ...base,
          action: "error",
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return actions;
  } finally {
    running = false;
  }
}

/** Test helper: extends one story right now, ignoring votes and timing. */
export async function forceExtend(articleId: string): Promise<{
  txHash: string;
  secondsLeftBefore: number;
  secondsLeftAfter: number | null;
}> {
  if (running) throw new KeeperBusyError();
  running = true;
  try {
    const story = (await listStories()).find((s) => s.articleId === articleId);
    if (!story) throw new Error("No story with that id on Arkiv");
    const secondsLeftBefore = Math.round((story.expiresAt - Date.now()) / 1000);
    const { txHash } = await extendStory(story.key);
    return {
      txHash,
      secondsLeftBefore,
      secondsLeftAfter: await secondsLeft(articleId),
    };
  } finally {
    running = false;
  }
}
