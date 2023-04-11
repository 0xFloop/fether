import "@rainbow-me/rainbowkit/styles.css";

import { ConnectButton, getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createClient, WagmiConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { useEffect, useState } from "react";
import Fether from "fetherkit";
import { readContract } from "@wagmi/core";
const fether = new Fether("abcd1234");

const { chains, provider } = configureChains([fether.chain], [publicProvider()]);

const { connectors } = getDefaultWallets({
  appName: "My RainbowKit App",
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

export default function Index() {
  useEffect(() => {
    fether.init();

    return () => {};
  }, []);

  const [number, setNumber] = useState<number>();

  const updateStateNumber = async () => {
    const number = await readContract({
      address: fether.address,
      abi: fether.abi,
      functionName: "getLeNumber",
    });

    setNumber(Number(number));
  };

  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <ConnectButton />;
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
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
