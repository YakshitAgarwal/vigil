import { createPublicClient, createWalletClient } from "@arkiv-network/sdk";
import { rabdi } from "@arkiv-network/sdk/chains";
import {
  createPublicClient as createEvmClient,
  http,
  isAddress,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

const chain = rabdi({ accessKey: process.env.ARKIV_ACCESS_KEY ?? "" });

export const evmClient = createEvmClient({ chain, transport: http() });

export const publicClient = createPublicClient({ chain, transport: http() });

export function editorAddress(): Address {
  const address = env("ADDRESS");
  if (!isAddress(address)) throw new Error("ADDRESS is not a valid address");
  return address;
}

export function editorClient() {
  const privateKey = env("PRIVATE_KEY");
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error("PRIVATE_KEY must be a 0x-prefixed 32-byte hex string");
  }
  const account = privateKeyToAccount(privateKey as Hex);
  return {
    account,
    wallet: createWalletClient({ chain, transport: http(), account }),
  };
}
