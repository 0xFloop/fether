import { WagmiConfig, createClient, Chain } from "wagmi";
import { getContract } from "@wagmi/core";
import { ConnectKitProvider, ConnectKitButton, getDefaultClient } from "connectkit";

const fetherChain: Chain = {
  id: 696969,
  name: "Fether",
  network: "fether",
  nativeCurrency: {
    decimals: 18,
    name: "Fether",
    symbol: "FEth",
  },
  rpcUrls: {
    default: { http: ["https://db5a-185-187-243-239.ngrok.io/rpc/123456"] },
    public: { http: ["https://db5a-185-187-243-239.ngrok.io/rpc/123456"] },
  },
  testnet: false,
};

const testAbi = [
  {
    inputs: [],
    name: "increment",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "number",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "number2",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "number3",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "newNumber",
        type: "uint256",
      },
    ],
    name: "setNumber",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const client = createClient(
  getDefaultClient({
    appName: "Fether Testing Client",
    alchemyId: "r8ilH_ju-8gNnskLhLGNGtIYpVwaIvOO",
    chains: [fetherChain],
  })
);

export default function Index() {
  const contract = getContract({
    address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
    abi: testAbi,
  });
  return (
    <WagmiConfig client={client}>
      <ConnectKitProvider>
        <ConnectKitButton />
        <button onClick={await contract.}></button>
      </ConnectKitProvider>
    </WagmiConfig>
  );
}
