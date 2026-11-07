import { NextResponse, type NextRequest } from "next/server";
import { KeeperBusyError, forceExtend, runKeeper } from "@/lib/keeper";
import { matchesSecret } from "@/lib/secret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Error text can contain RPC addresses with your access key. Never return those.
const redact = (message: string) => message.replace(/https?:\/\/\S+/g, "[url]");

export async function POST(req: NextRequest) {
  if (
    !matchesSecret(req.headers.get("x-keeper-key"), process.env.KEEPER_SECRET)
  ) {
    return NextResponse.json(
      { error: "Wrong or missing keeper key" },
      { status: 401 },
    );
  }

  try {
    // ?extend=<articleId> extends one story now, to test the write path on its own.
    const extend = req.nextUrl.searchParams.get("extend");
    if (extend) {
      return NextResponse.json({
        forced: true,
        ...(await forceExtend(extend)),
      });
    }

    // ?dry=1 shows what would happen without sending any transaction.
    const dryRun = req.nextUrl.searchParams.get("dry") === "1";
    const actions = await runKeeper({ dryRun });
    return NextResponse.json({
      dryRun,
      ranAt: new Date().toISOString(),
      actions,
    });
  } catch (err) {
    if (err instanceof KeeperBusyError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("keeper failed", err);
    const message =
      err instanceof Error ? redact(err.message) : "unknown error";
    return NextResponse.json(
      { error: `Keeper pass failed: ${message}` },
      { status: 502 },
    );
  }
}
