import { WagmiConfig, createClient, Chain } from "wagmi";
import { Ethereum, getContract } from "@wagmi/core";
import { ConnectKitProvider, ConnectKitButton, getDefaultClient } from "connectkit";
import { useEffect, useState } from "react";
import { createPublicClient, custom, http } from "viem";
import Fether from "fetherkit";
const fether = new Fether("abcd1234");

const publicClient = createPublicClient({
  chain: fether.chain,
  transport: http(),
});

export default function Index() {
  const client = createClient(
    getDefaultClient({
      appName: "Fether Testing Client",
      alchemyId: "r8ilH_ju-8gNnskLhLGNGtIYpVwaIvOO",
      chains: [fether.chain],
    })
  );
  const [number, setNumber] = useState<number>();

  const updateStateNumber = async () => {
    await fether.init();

    const data = (await publicClient.readContract({
      address: fether.address,
      abi: fether.abi,
      functionName: "getNumber",
    })) as bigint;
    setNumber(Number(data));
    console.log(data);
  };

  return (
    <WagmiConfig client={client}>
      <ConnectKitProvider>
        <ConnectKitButton />
        <button onClick={updateStateNumber}>click to get contract number value</button>
        <br />
        <br />
        <p>this is number {number}</p>
        <p>this is contractAddress {fether.address}</p>
        <p>this is contractAddress {fether.key}</p>
        <p>this is contractAbi {JSON.stringify(fether.abi[0])}</p>
      </ConnectKitProvider>
    </WagmiConfig>
  );
}
