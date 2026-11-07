import { createHash, randomBytes } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

const COOKIE = "vigil_voter";

/** DEMO ONLY: a random id in a cookie. Anyone can get a new one by clearing cookies. */
export function demoIdentity(req: NextRequest): { id: string; isNew: boolean } {
  const existing = req.cookies.get(COOKIE)?.value;
  if (existing && /^[0-9a-f]{64}$/.test(existing))
    return { id: existing, isNew: false };
  return { id: randomBytes(32).toString("hex"), isNew: true };
}

export function rememberIdentity(res: NextResponse, id: string): void {
  res.cookies.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Public voter id for one story. Salted and scoped to the story, so it can't be linked across stories. */
export function voterId(identity: string, storyKey: string): string {
  const salt = process.env.VOTER_SALT;
  if (!salt) throw new Error("Missing environment variable VOTER_SALT");
  return (
    "0x" +
    createHash("sha256").update(`${salt}:${storyKey}:${identity}`).digest("hex")
  );
}
