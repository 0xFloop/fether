import type { LoaderArgs, MetaFunction, V2_MetaFunction } from "@remix-run/node";
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";

import { BaseFetherChain, FetherProvider, fetherChainFromKey } from "fetherkit";

import rainbowStylesUrl from "@rainbow-me/rainbowkit/styles.css";

import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import { WalletProvider } from "./components/WalletProvider";

export function links() {
  return [{ rel: "stylesheet", href: rainbowStylesUrl }];
}
export const meta: V2_MetaFunction = () => {
  return [
    {
      property: "og:title",
      content: "Very cool app",
    },
    {
      name: "description",
      content: "This app is the best",
    },
    { title: "Very cool app | Remix" },
    {
      name: "viewport",
      content: "width=device-width,initial-scale=1",
    },
    { name: "charset", content: "utf-8" },
  ];
};

export default function App() {
  // const fetherChain = fetherChainFromKey(apiKey);
  const fetherKey = "clkemlcko000s1j2do01iitwp";

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <FetherProvider apiKey={fetherKey}>
          <WalletProvider>
            <Outlet />
          </WalletProvider>
        </FetherProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
