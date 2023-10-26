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
import {
  getSession as getInviteKeySession,
  commitSession,
} from "../utils/alphaAccessKeySession.server";
import {
  getSession as getUserIdSession,
  commitSession as userCommitSession,
} from "../utils/alphaSession.server";
import { WalletProvider } from "~/components/WalletProvider";
import { createContext, useState, Dispatch, SetStateAction } from "react";
import { Navbar } from "~/components/Navbar";
import { Footer } from "~/components/Footer";

export const loader = async ({ request, params }: LoaderArgs) => {
  const inviteKeySession = await getInviteKeySession(request.headers.get("Cookie"));
  const user = await getUserIdSession(request.headers.get("Cookie"));
  const url = new URL(request.url);
  if (url.pathname === "/alpha" || url.pathname === "/alpha/") {
    if (user.has("userId")) throw redirect("/alpha/dashboard");
    else if (inviteKeySession.has("inviteCode")) throw redirect("/alpha/login");
    else throw redirect("/");
  }
  let hasAccess = false;
  let isSignedIn = false;

  if (inviteKeySession.has("inviteCode")) {
    hasAccess = true;
  }
  if (user.has("userId")) {
    isSignedIn = true;
  }

  return json({ hasAccess, isSignedIn });
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
  const { hasAccess, isSignedIn } = useLoaderData<typeof loader>();
  const [displayInviteCodes, setDisplayInviteCodes] = useState<boolean>(false);
  const value = { displayInviteCodes, setDisplayInviteCodes };

  return (
    <DisplayCodesContext.Provider value={value}>
      <WalletProvider>
        <Navbar hasAccess={hasAccess} isSignedIn={isSignedIn} />
        <Outlet />
        <Footer />
      </WalletProvider>
    </DisplayCodesContext.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  const { hasAccess, isSignedIn } = useLoaderData<typeof loader>();

  if (error instanceof Error) {
    return (
      <html>
        <head>
          <title>Oh no!</title>
          <Meta />
          <Links />
        </head>
        <body>
          <Navbar hasAccess={hasAccess} isSignedIn={isSignedIn} />
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
          <Navbar hasAccess={hasAccess} isSignedIn={isSignedIn} />
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
