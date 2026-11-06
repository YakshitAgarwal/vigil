import type { CSSProperties } from "react";
import { LIFETIME, VOTING_CLOSES_WHEN_LEFT } from "@/lib/rules";
import { formatLeftWords } from "@/lib/time";
import type { Phase } from "@/lib/types";

type Props = {
  msLeft: number;
  phase: Phase;
  size?: "row" | "detail" | "lead";
  /** Burn down from full length once on load. Use on one element per page. */
  animate?: boolean;
  /** Show the labels under the line. */
  showScale?: boolean;
};

export function BurnLine({
  msLeft,
  phase,
  size = "row",
  animate = false,
  showScale = false,
}: Props) {
  const pct = Math.min(100, Math.max(0, (msLeft / LIFETIME) * 100));
  const closePct = (VOTING_CLOSES_WHEN_LEFT / LIFETIME) * 100;

  const label =
    phase === "faded"
      ? "Faded"
      : phase === "fading"
        ? `Voting closed. Fades in ${formatLeftWords(msLeft)}.`
        : `${formatLeftWords(msLeft - VOTING_CLOSES_WHEN_LEFT)} left to vote. Fades in ${formatLeftWords(msLeft)} unless renewed.`;

  return (
    <div>
      <div className="burn" data-size={size} data-phase={phase} role="img" aria-label={label}>
        <span className="burn-track" />
        <span
          className="burn-fuse"
          data-animate={animate || undefined}
          style={{ "--to": `${pct}%` } as CSSProperties}
        >
          <span className="burn-ember" />
        </span>
        <span className="burn-tick" style={{ left: `${closePct}%` }} />
      </div>
      {showScale && (
        <div className="relative mt-1 h-5 text-[13px] text-smoke" aria-hidden="true">
          <span className="absolute left-0 hidden sm:inline">Fades</span>
          <span
            className="absolute -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${closePct}%` }}
          >
            {phase === "open" ? "Voting closes" : "Voting closed"}
          </span>
          <span className="absolute right-0">A full week</span>
        </div>
      )}
    </div>
  );
}
