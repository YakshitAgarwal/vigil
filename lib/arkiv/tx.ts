import type { Address } from "viem";
import { evmClient } from "./client";

/** Runs tasks one at a time. Make one queue per wallet so its nonces never collide. */
export function createQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = tail.then(task, task);
    tail = run.catch(() => undefined);
    return run;
  };
}

// Rabdi serves state at the latest block only, and default gas can run out.
export async function txFields(address: Address) {
  const [nonce, gasPrice] = await Promise.all([
    evmClient.getTransactionCount({ address, blockTag: "latest" }),
    evmClient.getGasPrice(),
  ]);
  return { nonce, gasPrice, gas: 1_500_000n }; // single small entity
}
