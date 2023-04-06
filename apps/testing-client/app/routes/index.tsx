import { WagmiConfig, createClient, Chain } from "wagmi";
import { getContract } from "@wagmi/core";
import { ConnectKitProvider, ConnectKitButton, getDefaultClient } from "connectkit";
import { useState } from "react";
import { createPublicClient, http } from "viem";
import * as dotenv from "dotenv";
dotenv.config();

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
    default: { http: ["https://fether-testing.ngrok.app/rpc/123456"] },
    public: { http: ["https://fether-testing.ngrok.app/rpc/123456"] },
  },
  testnet: false,
};

const testAbi = [
  {
    inputs: [],
    name: "getNumber",
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
const publicClient = createPublicClient({
  chain: fetherChain,
  transport: http(),
});
export default function Index() {
  const client = createClient(
    getDefaultClient({
      appName: "Fether Testing Client",
      alchemyId: "r8ilH_ju-8gNnskLhLGNGtIYpVwaIvOO",
      chains: [fetherChain],
    })
  );
  const [number, setNumber] = useState<number>();
  const contract = getContract({
    address: "0xcd8ECbCCd21390cA2c2FD755d415FD21aA0e8359",
    abi: testAbi,
  });

  const updateStateNumber = async () => {
    const data = await publicClient.readContract({
      address: "0xcd8ECbCCd21390cA2c2FD755d415FD21aA0e8359",
      abi: testAbi,
      functionName: "getNumber",
    });
    console.log(data);
  };

  return (
    <WagmiConfig client={client}>
      <ConnectKitProvider>
        <ConnectKitButton />
        <button onClick={updateStateNumber}>click to get contract number value</button>
        <br />
        <br />
        <p>{number}</p>
      </ConnectKitProvider>
    </WagmiConfig>
  );
}
