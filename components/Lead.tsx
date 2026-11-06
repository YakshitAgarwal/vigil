"use client";

import Link from "next/link";
import { msLeft, phaseOf, votingMsLeft } from "@/lib/rules";
import { ago, formatLeft, times } from "@/lib/time";
import type { Story } from "@/lib/types";
import { BurnLine } from "./BurnLine";
import { Outcome } from "./Outcome";
import { VoteButtons } from "./VoteButtons";
import { VoteMeter } from "./VoteMeter";

export function Lead({ story, now }: { story: Story; now: number }) {
  const phase = phaseOf(story, now);
  const left = msLeft(story, now);
  const vote = votingMsLeft(story, now);

  return (
    <section aria-labelledby="lead-h" className="pt-12 sm:pt-20">
      <h1
        id="lead-h"
        className="max-w-[28ch] font-serif text-display font-medium tracking-[-0.015em] text-balance"
      >
        <Link href={`/story/${story.id}`} className="decoration-flame/60 decoration-2 hover:underline">
          {story.headline}
        </Link>
      </h1>

      <p className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-[15px] text-smoke">
        <span>{story.source.name}</span>
        <span>Posted {ago(story.postedAt, now)}</span>
        {story.rounds.length > 0 && <span>Renewed {times(story.rounds.length)}</span>}
      </p>

      <div className="mt-12">
        <BurnLine msLeft={left} phase={phase} size="lead" animate showScale />
      </div>

      <div className="mt-9 grid gap-x-14 gap-y-8 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-end">
        <div>
          <div className="font-serif text-numeral tabular-nums">{formatLeft(vote)}</div>
          <div className="mt-2 text-[15px]">until voting closes</div>
          <div className="mt-1 text-[13px] text-smoke">
            Fades in {formatLeft(left)} unless renewed
          </div>
        </div>
        <div className="max-w-[460px]">
          <VoteMeter keep={story.keep} fade={story.fade} />
          <Outcome story={story} phase={phase} />
        </div>
        <VoteButtons story={story} />
      </div>
    </section>
  );
}
