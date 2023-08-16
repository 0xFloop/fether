import {
  Chain,
  PublicClient,
  createPublicClient,
  createTestClient,
  createWalletClient,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { fetherChain } from "./config";

const pkaccount = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
);
export const deployerAddress = pkaccount.address;

export const walletClient = createWalletClient({
  account: deployerAddress,
  chain: fetherChain,
  transport: http(),
});

export const publicClient: PublicClient = createPublicClient({
  chain: fetherChain,
  transport: http(),
});

export const adminClient = createTestClient({
  chain: fetherChain,
  mode: "anvil",
  transport: http(),
});

export function fetherChainFromKey(apikey: string): Chain {
  return {
    id: 696969,
    name: "Fether",
    network: "fether",
    nativeCurrency: {
      decimals: 18,
      name: "Fether",
      symbol: "FEth",
    },
    rpcUrls: {
      default: {
        http: [
          `https://${
            process.env.NODE_ENV == "production"
              ? "fether-server.vercel.app"
              : "fether-testing.ngrok.app"
          }/rpc/${apikey}`,
        ],
      },
      public: {
        http: [
          `https://${
            process.env.NODE_ENV == "production"
              ? "fether-server.vercel.app"
              : "fether-testing.ngrok.app"
          }/rpc/${apikey}`,
        ],
      },
    },
    testnet: false,
  };
}
