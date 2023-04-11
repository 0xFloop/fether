import { WagmiConfig, createClient, Chain } from "wagmi";
import { Ethereum } from "@wagmi/core";
import { ConnectKitProvider, ConnectKitButton, getDefaultClient } from "connectkit";
import { useEffect, useState } from "react";
import { createPublicClient, custom, http } from "viem";
import Fether from "fetherkit";
const fether = new Fether("abcd1234");

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

  let publicClient = createPublicClient({
    chain: fether.chain,
    transport: http(),
  });

  const updateStateNumber = async () => {
    const test = await publicClient.readContract({
      address: fether.address,
      abi: fether.abi,
      functionName: "getLeNumber",
    });

    setNumber(Number(test));
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
