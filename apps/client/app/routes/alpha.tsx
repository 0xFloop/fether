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
import { Navbar } from "~/components/Navbar";

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
    <DisplayCodesContext.Provider value={value}>
      <WalletProvider>
        <Navbar hasAccess={userHasId} displayInvites={true} />
        <Outlet />
      </WalletProvider>
    </DisplayCodesContext.Provider>
  );
}
