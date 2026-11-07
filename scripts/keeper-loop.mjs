// Calls the keeper route on a timer.
// Run: node --env-file=.env.local scripts/keeper-loop.mjs [--dry]
const url = process.env.KEEPER_URL ?? "http://localhost:3000/api/keeper";
const secret = process.env.KEEPER_SECRET;
const everyMs = Number(process.env.KEEPER_INTERVAL_SECONDS ?? 30) * 1000;
const dry = process.argv.includes("--dry");

if (!secret) {
  console.error(
    "Set KEEPER_SECRET. Run with: node --env-file=.env.local scripts/keeper-loop.mjs",
  );
  process.exit(1);
}
if (!Number.isFinite(everyMs) || everyMs < 5000) {
  console.error("KEEPER_INTERVAL_SECONDS must be at least 5");
  process.exit(1);
}

process.on("SIGINT", () => process.exit(0));

const stamp = () => new Date().toLocaleTimeString("en-IN");

async function pass() {
  try {
    const res = await fetch(dry ? `${url}?dry=1` : url, {
      method: "POST",
      headers: { "x-keeper-key": secret },
      signal: AbortSignal.timeout(120_000),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(
        `[${stamp()}] keeper HTTP ${res.status}: ${body.error ?? "unknown error"}`,
      );
      return;
    }
    const actions = Array.isArray(body.actions) ? body.actions : [];
    const fmt = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;
    if (actions.length === 0) console.log(`[${stamp()}] no stories on Arkiv`);
    for (const a of actions) {
      const title =
        a.headline.length > 50 ? `${a.headline.slice(0, 50)}…` : a.headline;
      if (a.action === "waiting") {
        console.log(
          `[${stamp()}] waiting: ${title} (voting closes in ${fmt(a.closesInSeconds ?? 0)})`,
        );
        continue;
      }
      const votes =
        a.keep === undefined ? "" : ` (${a.keep} keep, ${a.fade} fade)`;
      console.log(
        `[${stamp()}] ${a.action}${votes}: ${title}${a.detail ? ` [${a.detail}]` : ""}`,
      );
    }
    console.log(
      `[${stamp()}] pass done, ${waiting} story(ies) still open${dry ? " (dry run)" : ""}`,
    );
  } catch (err) {
    console.error(
      `[${stamp()}] pass failed:`,
      err instanceof Error ? err.message : err,
    );
  }
}

while (true) {
  await pass();
  await new Promise((resolve) => setTimeout(resolve, everyMs));
}
