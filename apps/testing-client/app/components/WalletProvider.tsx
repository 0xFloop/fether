import type { PropsWithChildren, ReactNode } from "react";
import { useState } from "react";
import { ClientOnly } from "remix-utils";

import type { LoaderArgs, MetaFunction, V2_MetaFunction } from "@remix-run/node";
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";

import { BaseFetherChain, FetherProvider, fetherChainFromKey } from "fetherkit";

import rainbowStylesUrl from "@rainbow-me/rainbowkit/styles.css";

import { darkTheme, getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";

export function WalletProvider({ children, apiKey }: PropsWithChildren<{ apiKey: string }>) {
  const [{ wagmiConfig, chains }] = useState(() => {
    if (typeof window === "undefined") {
      return { wagmiConfig: null, chains: null };
    }

    const { chains, publicClient } = configureChains(
      [fetherChainFromKey(apiKey)],
      [alchemyProvider({ apiKey: "window.ENV.ALCHEMY_ID" }), publicProvider()]
    );
    const { connectors } = getDefaultWallets({
      appName: "fether",
      projectId: "42490798ad26dff0d5bfc67ee7abf1fb",
      chains,
    });
    const wagmiConfig = createConfig({
      autoConnect: true,
      connectors,
      publicClient,
    });

    return { wagmiConfig, chains };
  });

  return (
    <ClientOnly>
      {() =>
        wagmiConfig && chains?.length ? (
          <WagmiConfig config={wagmiConfig}>
            <RainbowKitProvider
              chains={chains}
              modalSize="compact"
              theme={darkTheme()}
              appInfo={{ appName: "fether" }}
            >
              {children}
            </RainbowKitProvider>
          </WagmiConfig>
        ) : null
      }
    </ClientOnly>
  );
}
