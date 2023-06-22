import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit";
import type { LinksFunction, MetaFunction, V2_MetaFunction } from "@vercel/remix";
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import { Chain, WagmiConfig, configureChains, createConfig } from "wagmi";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import { BaseFetherChain } from "~/utils/helpers";

import stylesheet from "~/tailwind.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: "https://rsms.me/inter/inter.css" },
  { href: stylesheet, rel: "stylesheet" },
];

export const meta: V2_MetaFunction = () => {
  return [
    { name: "charset", content: "utf-8" },
    { name: "title", content: "fether" },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
  ];
};

const { chains, publicClient } = configureChains(
  [BaseFetherChain],
  [alchemyProvider({ apiKey: "NOTNEEDED" }), publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "Fether",
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export default function App() {
  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <div className="mx-auto min-h-screen bg-[#f0f0f0]">
          <WagmiConfig config={wagmiConfig}>
            <RainbowKitProvider chains={chains}>
              <Outlet />
            </RainbowKitProvider>
          </WagmiConfig>
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
