"use client";

import Link from "next/link";
import { msLeft, phaseOf, votingMsLeft } from "@/lib/rules";
import { ago, formatLeft, times } from "@/lib/time";
import type { Story } from "@/lib/types";
import { BurnLine } from "./BurnLine";
import { Outcome } from "./Outcome";
import { VoteButtons } from "./VoteButtons";
import { VoteMeter } from "./VoteMeter";

export function StoryRow({ story, now }: { story: Story; now: number }) {
  const phase = phaseOf(story, now);
  const left = msLeft(story, now);
  const vote = votingMsLeft(story, now);

  return (
    <article className="border-t border-wick/70 py-8 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-6">
        <h3 className="max-w-[34ch] font-serif text-[1.5rem] font-medium leading-[1.2] text-balance">
          <Link href={`/story/${story.id}`} className="decoration-flame/70 hover:underline">
            {story.headline}
          </Link>
        </h3>
        <div className="shrink-0 text-right">
          <div className="font-serif text-[1.5rem] leading-none tabular-nums">
            {formatLeft(phase === "open" ? vote : left)}
          </div>
          <div className="mt-1 text-[13px] text-smoke">
            {phase === "open" ? "to vote" : "until it fades"}
          </div>
        </div>
      </div>

      <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-smoke">
        <span>{story.source.name}</span>
        <span>Posted {ago(story.postedAt, now)}</span>
        {story.rounds.length > 0 && <span>Renewed {times(story.rounds.length)}</span>}
      </p>

      <div className="mt-4">
        <BurnLine msLeft={left} phase={phase} size="row" />
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-[220px] max-w-[420px] flex-1">
          <VoteMeter keep={story.keep} fade={story.fade} size="row" muted={phase !== "open"} />
          <Outcome story={story} phase={phase} />
        </div>
        {phase === "open" && <VoteButtons story={story} compact />}
      </div>
    </article>
  );
}
