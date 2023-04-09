import { createPublicClient, createTestClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { fetherChain } from "./config";
import type {} from "abitype";

export const pkaccount = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
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
