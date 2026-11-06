"use client";

import Link from "next/link";
import { msLeft, phaseOf } from "@/lib/rules";
import { useVigil } from "@/lib/store";
import { ago } from "@/lib/time";
import { BurnLine } from "./BurnLine";
import { Outcome } from "./Outcome";
import { PageShell, Skeleton } from "./PageShell";
import { VoteMeter } from "./VoteMeter";

export function FadedList() {
  const { ready, now, stories } = useVigil();

  if (!ready) {
    return (
      <PageShell>
        <Skeleton />
      </PageShell>
    );
  }

  const faded = stories
    .filter((s) => phaseOf(s, now) === "faded")
    .sort((a, b) => b.expiresAt - a.expiresAt);

  return (
    <PageShell>
      <h1 className="pt-14 font-serif text-headline font-medium sm:pt-20">
        Faded
      </h1>
      <p className="mt-4 max-w-[54ch] text-[17px] leading-relaxed text-smoke">
        These stories went a full week without enough people keeping them. Each
        stays listed here for one last day, then it’s gone.
      </p>

      {faded.length === 0 ? (
        <p className="mt-16 max-w-[48ch] text-smoke">
          Nothing has faded yet. Stories land here when a round ends without a
          renewal.
        </p>
      ) : (
        <div className="mt-14 max-w-[760px]">
          {faded.map((story) => (
            <article
              key={story.id}
              className="border-t border-wick/70 py-8 first:border-t-0 first:pt-0"
            >
              <h2 className="max-w-[36ch] font-serif text-[1.5rem] font-medium leading-[1.2] text-balance text-smoke">
                <Link
                  href={`/story/${story.id}`}
                  className="hover:text-tallow hover:underline"
                >
                  {story.headline}
                </Link>
              </h2>
              <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-smoke">
                <span>{story.source.name}</span>
                <span>Faded {ago(story.expiresAt, now)}</span>
              </p>
              <div className="mt-3">
                <BurnLine
                  msLeft={msLeft(story, now)}
                  phase="faded"
                  size="row"
                />
              </div>
              <div className="mt-5 max-w-[420px]">
                <VoteMeter
                  keep={story.keep}
                  fade={story.fade}
                  size="row"
                  muted
                />
                <Outcome story={story} phase="faded" />
              </div>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
