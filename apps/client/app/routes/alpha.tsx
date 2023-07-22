import { ActionArgs, LoaderArgs, json, redirect } from "@vercel/remix";
import { Form, Link, Outlet, useActionData, useLoaderData } from "@remix-run/react";
import { db } from "../utils/db.server";
import { getSession, commitSession } from "../utils/alphaAccessKeySession.server";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
} from "../utils/alphaSession.server";
import { WagmiConfig, configureChains, createConfig } from "wagmi";
import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import { fetherChainFromKey } from "~/utils/helpers";

export const loader = async ({ request, params }: LoaderArgs) => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = await userGetSession(request.headers.get("Cookie"));
  const url = new URL(request.url);
  if (url.pathname === "/alpha" || url.pathname === "/alpha/") {
    if (user.has("userId")) throw redirect("/alpha/dashboard");
    else if (session.has("alphaKey")) throw redirect("/alpha/login");
    else throw redirect("/");
  }
  return user.has("userId");
};

const { chains, publicClient } = configureChains(
  [fetherChainFromKey("GlobalLoader")],
  [alchemyProvider({ apiKey: "NOTNEEDED" }), publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "Fether",
  projectId: "42490798ad26dff0d5bfc67ee7abf1fb",
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export default function Index() {
  const userHasId = useLoaderData<typeof loader>();
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <div className="relative min-h-screen">
          <div
            id="navbar"
            className="absolute w-full h-20 border-b border-b-black flex flex-row justify-between items-center z-50 bg-[#f0f0f0]"
          >
            <Link to="/" id="logo" className="text-5xl flex-1 pl-8 ">
              fether
            </Link>
            {userHasId && (
              <div className="flex-1  pr-8">
                <a id="signout" href="/alpha/sign-out" className="float-right">
                  signout
                </a>
              </div>
            )}
          </div>
          <Outlet />
        </div>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
