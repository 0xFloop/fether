import type { LoaderArgs, MetaFunction, V2_MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

import { FetherProvider, BaseFetherChain } from "fetherkit";

import rainbowStylesUrl from "@rainbow-me/rainbowkit/styles.css";

import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";

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
export const loader = async ({ request }: LoaderArgs) => {
  //validate session cookie

  const apiKey = process.env.API_KEY as string;

  return apiKey;
};
export default function App() {
  const apiKey = useLoaderData<typeof loader>();

  const { chains, publicClient } = configureChains(
    [BaseFetherChain],
    [alchemyProvider({ apiKey: "THIS ISNT NEEDED" }), publicProvider()]
  );

  const { connectors } = getDefaultWallets({
    appName: "My RainbowKit App",
    projectId: "YOUR_PROJECT_ID",
    chains,
  });

  const wagmiConfig = createConfig({
    autoConnect: true,
    connectors,
    publicClient,
  });

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <FetherProvider apiKey={apiKey}>
          <WagmiConfig config={wagmiConfig}>
            <RainbowKitProvider chains={chains}>
              <Outlet />
            </RainbowKitProvider>
          </WagmiConfig>
        </FetherProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
