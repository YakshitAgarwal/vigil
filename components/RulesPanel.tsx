function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-6 py-3">
      <dt className="text-smoke">{k}</dt>
      <dd className="max-w-[20ch] text-right">{v}</dd>
    </div>
  );
}

export function RulesPanel() {
  return (
    <section aria-labelledby="rules-h">
      <h2
        id="rules-h"
        className="font-serif text-[1.5rem] font-medium leading-tight"
      >
        How a story stays lit
      </h2>
      <p className="mt-3 max-w-[36ch] text-[15px] leading-relaxed text-smoke">
        The editor posts a story with a week to live. Verified people decide
        whether it gets another.
      </p>
      <dl className="mt-6 divide-y divide-wick/70 border-y border-wick/70 text-[15px]">
        <Row k="Each round" v="7 days" />
        <Row k="Voting closes" v="With 1 day left" />
        <Row k="To renew" v="At least 300 people, and more than half keep" />
        <Row k="Votes" v="One per person, per story" />
        <Row k="Privacy" v="No name or wallet is stored with a vote" />
      </dl>
      <p className="mt-5 max-w-[36ch] text-[14px] leading-relaxed text-smoke">
        Every vote is stored on Arkiv, so anyone can recount it.
      </p>
    </section>
  );
}
