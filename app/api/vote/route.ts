import { NextResponse, type NextRequest } from "next/server";
import { listStories } from "@/lib/arkiv/read";
import { castVote } from "@/lib/arkiv/votes";
import { allow } from "@/lib/rate-limit";
import { VOTING_CLOSES_WHEN_LEFT } from "@/lib/rules";
import { demoIdentity, rememberIdentity, voterId } from "@/lib/voter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allow(ip, 20, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many votes from this connection. Try again later." },
      { status: 429 },
    );
  }

  let data: unknown;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }
  const { articleId, choice } = (data ?? {}) as Record<string, unknown>;
  if (
    typeof articleId !== "string" ||
    (choice !== "keep" && choice !== "fade")
  ) {
    return NextResponse.json(
      { error: "articleId and a choice of keep or fade are required" },
      { status: 400 },
    );
  }

  try {
    const story = (await listStories()).find((s) => s.articleId === articleId);
    if (!story) {
      return NextResponse.json(
        { error: "That story isn’t on Vigil, or it has faded." },
        { status: 404 },
      );
    }
    if (story.expiresAt - Date.now() <= VOTING_CLOSES_WHEN_LEFT) {
      return NextResponse.json(
        { error: "Voting has closed for this story." },
        { status: 403 },
      );
    }

    const identity = demoIdentity(req);
    const result = await castVote({
      storyKey: story.key,
      round: BigInt(story.expiresAtBlock),
      // The round is part of the hash, so one person's votes can't be linked across rounds.
      voter: voterId(identity.id, `${story.key}:${story.expiresAtBlock}`),
      choice,
    });

    const res = result.ok
      ? NextResponse.json({
          ok: true,
          choice,
          round: story.expiresAtBlock,
          txHash: result.txHash,
        })
      : NextResponse.json(
          {
            error: "You already voted on this story.",
            choice: result.existing,
            round: story.expiresAtBlock,
          },
          { status: 409 },
        );
    if (identity.isNew) rememberIdentity(res, identity.id);
    return res;
  } catch (err) {
    console.error("vote failed", err);
    return NextResponse.json(
      { error: "Couldn’t save your vote. Try again in a moment." },
      { status: 502 },
    );
  }
}
