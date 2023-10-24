import { ActionArgs, LoaderArgs, json, redirect } from "@vercel/remix";
import {
  Form,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  useActionData,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";
import { db } from "../utils/db.server";
import { getSession, commitSession } from "../utils/alphaAccessKeySession.server";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
} from "../utils/alphaSession.server";
import { WalletProvider } from "~/components/WalletProvider";
import { createContext, useState, Dispatch, SetStateAction } from "react";
import { Navbar } from "~/components/Navbar";
import { Footer } from "~/components/Footer";

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
        <Footer />
      </WalletProvider>
    </DisplayCodesContext.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const userHasId = useLoaderData<typeof loader>();

  if (error instanceof Error) {
    return (
      <html>
        <head>
          <title>Oh no!</title>
          <Meta />
          <Links />
        </head>
        <body>
          <Navbar hasAccess={userHasId} displayInvites={false} />
          <div className="h-screen w-screen flex flex-col justify-center align-middle items-center bg-primary-gray text-white font-primary">
            <h1>Uh oh ...</h1>
            <p>Something went wrong.</p>
            <pre>Error: {error.message}</pre>
            <Link
              to="/alpha/dashboard"
              className="mt-4 border border-off-white/25 text-off-white/25 px-4"
            >
              Back to dashboard
            </Link>
          </div>
          <Scripts />
        </body>
      </html>
    );
  } else {
    return (
      <html>
        <head>
          <title>Oh no!</title>
          <Meta />
          <Links />
        </head>
        <body>
          <Navbar hasAccess={userHasId} displayInvites={false} />
          <div className="h-screen w-screen flex flex-col justify-center align-middle items-center bg-primary-gray text-white font-primary">
            <h1>Uh oh ...</h1>
            <p>Something went wrong.</p>
            <pre>Error: {JSON.stringify(error)}</pre>
            <Link
              to="/alpha/dashboard"
              className="mt-4 border border-off-white/25 text-off-white/25 px-4"
            >
              Back to dashboard
            </Link>
          </div>

          <Scripts />
        </body>
      </html>
    );
  }
}
