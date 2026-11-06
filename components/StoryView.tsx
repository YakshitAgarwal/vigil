"use client";

import Link from "next/link";
import { msLeft, phaseOf, votingMsLeft } from "@/lib/rules";
import { useVigil } from "@/lib/store";
import { ago, formatLeft, shortDate, times } from "@/lib/time";
import { BurnLine } from "./BurnLine";
import { ChevronLeft } from "./Icons";
import { Outcome } from "./Outcome";
import { PageShell, Skeleton } from "./PageShell";
import { ProofPanel } from "./ProofPanel";
import { Timeline } from "./Timeline";
import { VoteButtons } from "./VoteButtons";
import { VoteMeter } from "./VoteMeter";

export function StoryView({ id }: { id: string }) {
  const { ready, now, stories } = useVigil();

  if (!ready) {
    return (
      <PageShell>
        <Skeleton />
      </PageShell>
    );
  }

  const story = stories.find((s) => s.id === id);
  if (!story) {
    return (
      <PageShell>
        <p className="pt-24 font-serif text-headline">That story isn’t here.</p>
        <p className="mt-3 max-w-[48ch] text-smoke">
          It may not exist in this demo, or it faded and has been cleared.{" "}
          <Link href="/" className="text-tallow underline">
            See what’s burning now
          </Link>
          .
        </p>
      </PageShell>
    );
  }

  const phase = phaseOf(story, now);
  const left = msLeft(story, now);
  const vote = votingMsLeft(story, now);

  const heading =
    phase === "open" ? "Should this stay lit?" : phase === "fading" ? "Voting has closed" : "This story faded";

  return (
    <PageShell>
      <Link
        href={phase === "faded" ? "/faded" : "/"}
        className="mt-10 inline-flex items-center gap-1.5 text-[15px] text-smoke hover:text-tallow"
      >
        <ChevronLeft className="size-4" />
        {phase === "faded" ? "Faded" : "Burning now"}
      </Link>

      <h1 className="mt-8 max-w-[26ch] font-serif text-headline font-medium tracking-[-0.01em] text-balance">
        {story.headline}
      </h1>

      <p className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[15px] text-smoke">
        <span>{story.source.name}</span>
        <span>Posted {ago(story.postedAt, now)}</span>
        {story.rounds.length > 0 && <span>Renewed {times(story.rounds.length)}</span>}
      </p>

      <p className="mt-7 max-w-[58ch] font-serif text-[1.25rem] leading-[1.6] text-tallow/90">
        {story.summary}
      </p>
      <a
        href={story.source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block text-[15px] text-tallow underline decoration-flame/60"
      >
        Read the original at {story.source.name}
      </a>

      <div className="mt-12">
        <BurnLine msLeft={left} phase={phase} size="detail" showScale />
      </div>

      <div className="mt-14 grid gap-x-20 gap-y-16 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="vote-h">
          <h2 id="vote-h" className="font-serif text-[1.65rem] font-medium">
            {heading}
          </h2>

          <div className="mt-6">
            {phase === "faded" ? (
              <>
                <div className="font-serif text-numeral text-smoke">Faded</div>
                <div className="mt-2 text-[15px] text-smoke">{shortDate(story.expiresAt)}</div>
              </>
            ) : (
              <>
                <div className="font-serif text-numeral tabular-nums">
                  {formatLeft(phase === "open" ? vote : left)}
                </div>
                <div className="mt-2 text-[15px]">
                  {phase === "open" ? "until voting closes" : "until it fades"}
                </div>
              </>
            )}
          </div>

          <div className="mt-7 max-w-[520px]">
            <VoteMeter keep={story.keep} fade={story.fade} muted={phase !== "open"} />
            <Outcome story={story} phase={phase} />
          </div>

          {phase === "open" && (
            <div className="mt-7">
              <VoteButtons story={story} />
            </div>
          )}

          <ProofPanel story={story} />
        </section>

        <aside aria-labelledby="updates-h">
          <h2 id="updates-h" className="font-serif text-[1.65rem] font-medium">
            What’s changed
          </h2>
          <div className="mt-6">
            <Timeline story={story} phase={phase} />
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
