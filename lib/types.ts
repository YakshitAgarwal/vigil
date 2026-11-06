export type Choice = "keep" | "fade";

/** open: voting is live. fading: voting closed and the story was not renewed. faded: expired. */
export type Phase = "open" | "fading" | "faded";

export type Round = {
  endedAt: number;
  keep: number;
  fade: number;
};

export type StoryUpdate = {
  at: number;
  text: string;
  source: string;
};

export type Story = {
  id: string;
  headline: string;
  summary: string;
  source: { name: string; url: string };
  postedAt: number;
  /** Absolute expiry of the Arkiv entity, in ms since epoch. */
  expiresAt: number;
  /** Votes in the current round. */
  keep: number;
  fade: number;
  quorum: number;
  /** Finished rounds that ended in a renewal. */
  rounds: Round[];
  updates: StoryUpdate[];
  arkiv: {
    key: string;
    contentHash: string;
    snapshotBlock: number | null;
    renewalTxs: string[];
  };
  /** Set locally when this browser has voted. */
  myVote?: Choice;
};
