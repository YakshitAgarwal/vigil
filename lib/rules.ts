import type { Phase, Story } from "./types";

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

/** Every round lasts a week. */
export const LIFETIME = 7 * DAY;
/** Voting closes when one day is left, so the keeper has a day to renew. */
export const VOTING_CLOSES_WHEN_LEFT = DAY;
export const QUORUM = 300;

export type Tally = {
  total: number;
  keepShare: number;
  quorumMet: boolean;
  passing: boolean;
  missing: number;
};

export function tally(s: Pick<Story, "keep" | "fade" | "quorum">): Tally {
  const total = s.keep + s.fade;
  const keepShare = total === 0 ? 0 : s.keep / total;
  const quorumMet = total >= s.quorum;
  return {
    total,
    keepShare,
    quorumMet,
    passing: quorumMet && keepShare > 0.5,
    missing: Math.max(0, s.quorum - total),
  };
}

export function phaseOf(s: Story, now: number): Phase {
  const left = s.expiresAt - now;
  if (left <= 0) return "faded";
  if (left <= VOTING_CLOSES_WHEN_LEFT) return "fading";
  return "open";
}

export const msLeft = (s: Story, now: number) => Math.max(0, s.expiresAt - now);

export const votingMsLeft = (s: Story, now: number) =>
  Math.max(0, s.expiresAt - now - VOTING_CLOSES_WHEN_LEFT);

export function outcomeLabel(s: Story, phase: Phase): string {
  const t = tally(s);
  const pct = Math.round(t.keepShare * 100);
  if (phase === "faded") {
    return t.quorumMet
      ? `Faded. ${pct}% kept it, and more than half was needed.`
      : `Faded. ${t.total} people voted and ${s.quorum} were needed.`;
  }
  if (phase === "fading") {
    return t.quorumMet
      ? `Not renewed. ${pct}% kept it.`
      : `Not renewed. ${t.total} of the ${s.quorum} people needed voted.`;
  }
  if (!t.quorumMet) {
    return `${t.missing} more ${t.missing === 1 ? "person" : "people"} needed to vote`;
  }
  return t.passing ? "On track to renew" : "On track to fade";
}
