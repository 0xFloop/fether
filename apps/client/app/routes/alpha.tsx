import { ActionArgs, LoaderArgs, json, redirect } from "@vercel/remix";
import { Form, Link, Outlet, useActionData, useLoaderData } from "@remix-run/react";
import { db } from "../utils/db.server";
import { getSession, commitSession } from "../utils/alphaAccessKeySession.server";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
} from "../utils/alphaSession.server";
import { WalletProvider } from "~/components/WalletProvider";
import { createContext, useState, Dispatch, SetStateAction } from "react";

export const loader = async ({ request, params }: LoaderArgs) => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = await userGetSession(request.headers.get("Cookie"));
  const url = new URL(request.url);
  if (url.pathname === "/alpha" || url.pathname === "/alpha/") {
    if (user.has("userId")) throw redirect("/alpha/dashboard");
    else if (session.has("inviteCode")) throw redirect("/alpha/login");
    else throw redirect("/");
  }
  return user.has("userId");
};
type DisplayCodesContextType = {
  displayInviteCodes: boolean;
  setDisplayInviteCodes: Dispatch<SetStateAction<boolean>>;
};
export const DisplayCodesContext = createContext<DisplayCodesContextType>({
  displayInviteCodes: false,
  setDisplayInviteCodes: () => {},
});

export default function Index() {
  const userHasId = useLoaderData<typeof loader>();
  const [displayInviteCodes, setDisplayInviteCodes] = useState<boolean>(false);
  const value = { displayInviteCodes, setDisplayInviteCodes };

  return (
    <div className="relative min-h-screen bg-primary-gray">
      <div
        id="navbar"
        className="absolute w-full h-20 border-b text-white border-b-white flex flex-row justify-between items-center z-60"
      >
        <Link to="/" id="logo" className="text-5xl flex-1 pl-8 font-primary">
          fether
        </Link>
        {userHasId && (
          <div className="flex items-center float-right h-full">
            <button
              className="px-8 flex items-center h-full border-r border-r-white"
              onClick={() => setDisplayInviteCodes(!displayInviteCodes)}
            >
              invite
            </button>
            <a id="signout" href="/alpha/sign-out" className="px-8">
              signout
            </a>
          </div>
        )}
      </div>
      <DisplayCodesContext.Provider value={value}>
        <WalletProvider>
          <Outlet />
        </WalletProvider>
      </DisplayCodesContext.Provider>
    </div>
  );
}
