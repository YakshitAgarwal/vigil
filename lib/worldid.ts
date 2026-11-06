export type VerifyResult =
  | { ok: true; nullifierHash: string }
  | { ok: false; reason: string };

/**
 * Demo stand-in. It waits a moment and succeeds.
 *
 * To make it real, use World's IDKit v4 flow: sign the request on your
 * server, show the IDKit widget, forward the proof to World's verify
 * endpoint from your backend, and resolve `ok: true` only after that
 * check passes. Scope the action to the story so one person gets one
 * vote per story, and accept only v4 proofs.
 */
export async function verifyHuman(): Promise<VerifyResult> {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return { ok: true, nullifierHash: "0x" + "0".repeat(64) };
}
