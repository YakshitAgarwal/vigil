import { tally } from "@/lib/rules";
import { shortHex } from "@/lib/time";
import type { Story } from "@/lib/types";

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-x-6 gap-y-0.5 py-3 sm:grid-cols-[150px_1fr]">
      <dt className="text-smoke">{k}</dt>
      <dd className="break-all tabular-nums">{children}</dd>
    </div>
  );
}

export function ProofPanel({ story }: { story: Story }) {
  const t = tally(story);
  return (
    <details className="mt-10 border-t border-wick/70 pt-5">
      <summary className="font-serif text-[1.25rem] font-medium">Check the count</summary>
      <dl className="mt-4 divide-y divide-wick/70 text-[14px]">
        <Row k="Story entity">{shortHex(story.arkiv.key)}</Row>
        <Row k="Article hash">{shortHex(story.arkiv.contentHash)}</Row>
        <Row k="People counted">{t.total.toLocaleString("en-IN")}, one World ID each</Row>
        <Row k="Counted at block">
          {story.arkiv.snapshotBlock
            ? `#${story.arkiv.snapshotBlock.toLocaleString("en-IN")}`
            : "Set when voting closes"}
        </Row>
        <Row k="Renewals">
          {story.arkiv.renewalTxs.length === 0
            ? "None yet"
            : story.arkiv.renewalTxs.map((tx) => <span key={tx} className="block">{shortHex(tx)}</span>)}
        </Row>
      </dl>
      <p className="mt-4 max-w-[56ch] text-[14px] leading-relaxed text-smoke">
        Anyone can recount from the public votes on Arkiv. The rule is the same for every story: at
        least 300 people voted and more than half chose keep. Values here are samples in this demo.
      </p>
    </details>
  );
}
