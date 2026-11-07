"use client";

import { useVigil } from "@/lib/store";
import type { Story } from "@/lib/types";

export function VoteButtons({
  story,
  compact = false,
}: {
  story: Story;
  compact?: boolean;
}) {
  const { vote, votingId, voteError } = useVigil();
  const saving = votingId === story.id;

  if (story.myVote) {
    return (
      <p className="max-w-[28ch] text-[14px] text-smoke" role="status">
        You chose to{" "}
        {story.myVote === "keep" ? "keep this burning" : "let this fade"}. Votes
        are final.
      </p>
    );
  }

  const size = compact ? "px-4 text-[14px]" : "px-5 text-[15px]";
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => vote(story.id, "keep")}
          className={`min-h-11 rounded-full bg-flame font-semibold text-night hover:bg-[#ffc064] active:translate-y-px disabled:opacity-60 ${size}`}
        >
          Keep burning
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => vote(story.id, "fade")}
          className={`min-h-11 rounded-full border border-moon/60 font-medium text-moon hover:bg-moon/10 active:translate-y-px disabled:opacity-60 ${size}`}
        >
          Let it fade
        </button>
      </div>
      {saving && (
        <p role="status" className="mt-2 text-[14px] text-smoke">
          Saving your vote to Arkiv
        </p>
      )}
      {voteError?.id === story.id && (
        <p role="alert" className="mt-2 max-w-[40ch] text-[14px] text-heat">
          {voteError.message}
        </p>
      )}
    </div>
  );
}
