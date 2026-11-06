type Props = {
  keep: number;
  fade: number;
  size?: "row" | "detail";
  /** Greyed out, for stories that are no longer open. */
  muted?: boolean;
  showCounts?: boolean;
};

export function VoteMeter({ keep, fade, size = "detail", muted = false, showCounts = true }: Props) {
  const total = keep + fade;
  return (
    <div>
      <div
        className="meter"
        data-size={size}
        data-muted={muted || undefined}
        role="img"
        aria-label={`${keep} voted to keep it, ${fade} voted to let it fade`}
      >
        <span className="meter-keep" style={{ flexGrow: keep }} />
        <span className="meter-fade" style={{ flexGrow: fade }} />
        {total > 0 && <span className="meter-mid" />}
      </div>
      {showCounts && (
        <div className="mt-2 flex justify-between text-[13px] tabular-nums text-smoke">
          <span>{keep.toLocaleString("en-IN")} keep</span>
          <span>{fade.toLocaleString("en-IN")} fade</span>
        </div>
      )}
    </div>
  );
}
