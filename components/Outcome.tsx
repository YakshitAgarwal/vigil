import { outcomeLabel, tally } from "@/lib/rules";
import type { Phase, Story } from "@/lib/types";

export function Outcome({ story, phase }: { story: Story; phase: Phase }) {
  const t = tally(story);
  const tone =
    phase !== "open" || !t.quorumMet ? "text-smoke" : t.passing ? "text-flame" : "text-moon";
  return <p className={`mt-1 text-[14px] ${tone}`}>{outcomeLabel(story, phase)}</p>;
}
