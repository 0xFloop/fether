import { createPublicClient, createTestClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { fetherChain } from "./config";
import type {} from "abitype";

export const pkaccount = privateKeyToAccount(
  "0x1cbf6ecb72178c9811509d1767d0cdb27cfc862b3b4d89ba1d3e30ad17215b4b"
);
export const address = pkaccount.address;

export const walletClient = createWalletClient({
  account: address,
  chain: fetherChain,
  transport: http(),
});

export const publicClient = createPublicClient({
  chain: fetherChain,
  transport: http(),
});

export const adminClient = createTestClient({
  chain: fetherChain,
  mode: "anvil",
  transport: http(),
});
