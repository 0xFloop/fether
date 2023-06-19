import type { MetaFunction } from "@remix-run/node";
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import { ConnectKitProvider, getDefaultClient } from "connectkit";
import { FetherProvider, BaseFetherChain } from "fetherkit";
import { WagmiConfig, createClient } from "wagmi";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "New Remix App",
  viewport: "width=device-width,initial-scale=1",
});
export default function App() {
  const client = createClient(
    getDefaultClient({
      appName: "Fether Testing Client",
      alchemyId: "r8ilH_ju-8gNnskLhLGNGtIYpVwaIvOO",
      chains: [BaseFetherChain],
    })
  );
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <FetherProvider apiKey={process.env.API_KEY as string}>
          <WagmiConfig client={client}>
            <ConnectKitProvider>
              <Outlet />
            </ConnectKitProvider>
          </WagmiConfig>
        </FetherProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
