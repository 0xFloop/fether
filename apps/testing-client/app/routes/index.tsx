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
  useEffect(() => {
    fether.init();

    return () => {};
  }, []);

  const client = createClient(
    getDefaultClient({
      appName: "Fether Testing Client",
      alchemyId: "r8ilH_ju-8gNnskLhLGNGtIYpVwaIvOO",
      chains: [fether.chain],
    })
  );
  const [number, setNumber] = useState<number>();

  const updateStateNumber = async () => {
    const data = (await publicClient.readContract({
      address: fether.address,
      abi: fether.abi,
      functionName: "getTheNumber",
    })) as bigint;

    setNumber(Number(data));
  };

  return (
    <WagmiConfig client={client}>
      <ConnectKitProvider>
        <ConnectKitButton />
        <button onClick={updateStateNumber}>click to get contract number value</button>
        <br />
        <br />
        <p>contract number {number}</p>
        <p>contract address {fether.address}</p>
        <p>All abi methods listed below</p>
        <ul>
          {fether.abi.map((method) => (
            <li>{JSON.stringify(method["name"])}</li>
          ))}{" "}
        </ul>
      </ConnectKitProvider>
    </WagmiConfig>
  );
}
