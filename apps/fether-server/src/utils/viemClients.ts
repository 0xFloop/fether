import { createPublicClient, createTestClient, createWalletClient, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { fetherChain } from "./config";
import type {} from "abitype";
const testprivateKey = generatePrivateKey();

export const pkaccount = privateKeyToAccount(testprivateKey);

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
