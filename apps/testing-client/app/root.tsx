import type { LoaderArgs, MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { ConnectKitProvider, getDefaultClient } from "connectkit";
import { FetherProvider, BaseFetherChain } from "fetherkit";
import { WagmiConfig, createClient } from "wagmi";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "New Remix App",
  viewport: "width=device-width,initial-scale=1",
});
export const loader = async ({ request }: LoaderArgs) => {
  //validate session cookie

  const apiKey = process.env.API_KEY as string;

  return apiKey;
};
export default function App() {
  const apiKey = useLoaderData<typeof loader>();

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
        <FetherProvider apiKey={apiKey}>
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
