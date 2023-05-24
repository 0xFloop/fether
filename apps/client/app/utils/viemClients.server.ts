import { Chain, createPublicClient, createTestClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const fetherChain: Chain = {
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
      http: [`https://fether-testing.ngrok.app/rpc/${process.env.API_KEY as string}`],
    },
    public: { http: [`https://fether-testing.ngrok.app/rpc/${process.env.API_KEY as string}`] },
  },
  testnet: false,
};

const pkaccount = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
);

export const deployerAddress = pkaccount.address;

export const walletClient = createWalletClient({
  account: deployerAddress,
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
