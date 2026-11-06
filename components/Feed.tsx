"use client";

import { phaseOf } from "@/lib/rules";
import { useVigil } from "@/lib/store";
import { Lead } from "./Lead";
import { PageShell, Skeleton } from "./PageShell";
import { RulesPanel } from "./RulesPanel";
import { StoryRow } from "./StoryRow";

export function Feed() {
  const { ready, now, stories } = useVigil();

  if (!ready) {
    return (
      <PageShell>
        <Skeleton />
      </PageShell>
    );
  }

  const live = stories
    .filter((s) => phaseOf(s, now) !== "faded")
    .sort((a, b) => a.expiresAt - b.expiresAt);
  const lead = live.find((s) => phaseOf(s, now) === "open");
  const rest = live.filter((s) => s.id !== lead?.id);

  if (live.length === 0) {
    return (
      <PageShell>
        <p className="pt-24 font-serif text-headline">Nothing is burning right now.</p>
        <p className="mt-3 max-w-[48ch] text-smoke">
          New stories appear here when the editor posts them. Faded stories are on the Faded page.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {lead && <Lead story={lead} now={now} />}

      <div className="mt-24 grid gap-x-20 gap-y-16 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-labelledby="burning-h">
          <h2 id="burning-h" className="font-serif text-[1.65rem] font-medium">
            Also burning
          </h2>
          <p className="mt-1 text-[15px] text-smoke">Least time left comes first.</p>
          <div className="mt-8">
            {rest.map((story) => (
              <StoryRow key={story.id} story={story} now={now} />
            ))}
          </div>
        </section>
        <aside className="self-start lg:sticky lg:top-8">
          <RulesPanel />
        </aside>
      </div>
    </PageShell>
  );
}
