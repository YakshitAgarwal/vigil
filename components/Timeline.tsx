import { shortDate } from "@/lib/time";
import type { Phase, Story } from "@/lib/types";

type TimelineEvent = { at: number; text: string; detail?: string; tone: "post" | "update" | "renew" | "fade" };

function buildEvents(story: Story, phase: Phase): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { at: story.postedAt, text: "Posted by the editor", detail: story.source.name, tone: "post" },
    ...story.updates.map<TimelineEvent>((u) => ({ at: u.at, text: u.text, detail: u.source, tone: "update" })),
    ...story.rounds.map<TimelineEvent>((r) => ({
      at: r.endedAt,
      text: `Renewed for another week. ${r.keep.toLocaleString("en-IN")} kept it and ${r.fade.toLocaleString("en-IN")} let it fade.`,
      tone: "renew",
    })),
  ];
  if (phase === "faded") {
    events.push({ at: story.expiresAt, text: "Faded without a renewal", tone: "fade" });
  }
  return events.sort((a, b) => b.at - a.at);
}

const dot: Record<TimelineEvent["tone"], string> = {
  post: "bg-smoke",
  update: "bg-tallow",
  renew: "bg-flame",
  fade: "bg-ash",
};

export function Timeline({ story, phase }: { story: Story; phase: Phase }) {
  const events = buildEvents(story, phase);
  return (
    <ol className="relative space-y-7 border-l border-wick pl-6">
      {events.map((e, i) => (
        <li key={i} className="relative">
          <span
            aria-hidden="true"
            className={`absolute -left-[29px] top-[7px] size-[9px] rounded-full ring-4 ring-night ${dot[e.tone]}`}
          />
          <time className="text-[13px] tabular-nums text-smoke">{shortDate(e.at)}</time>
          <p className="mt-0.5 text-[16px] leading-snug">{e.text}</p>
          {e.detail && <p className="mt-0.5 text-[14px] text-smoke">{e.detail}</p>}
        </li>
      ))}
    </ol>
  );
}
