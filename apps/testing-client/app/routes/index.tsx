import { WagmiConfig, createClient, Chain } from "wagmi";
import { getContract } from "@wagmi/core";
import { ConnectKitProvider, ConnectKitButton, getDefaultClient } from "connectkit";
import { useState } from "react";

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

const client = createClient(
  getDefaultClient({
    appName: "Fether Testing Client",
    alchemyId: "r8ilH_ju-8gNnskLhLGNGtIYpVwaIvOO",
    chains: [fetherChain],
  })
);

export default function Index() {
  const [number, setNumber] = useState<number>(0);
  const contract = getContract({
    address: "0xe846c6fcf817734ca4527b28ccb4aea2b6663c79",
    abi: testAbi,
  });

  const updateStateNumber = async () => {
    console.log("within updateStateNumber");
    console.log(await contract.getNumber());
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
