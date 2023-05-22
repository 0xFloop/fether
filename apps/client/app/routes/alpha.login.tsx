import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node";
import { Form, Link, useActionData } from "@remix-run/react";
import { db } from "../db.server";
import { getSession, commitSession } from "../utils/alphaAccessKeySession.server";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
} from "../utils/alphaSession.server";

export const loader = async ({ request }: LoaderArgs) => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = await userGetSession(request.headers.get("Cookie"));
  if (!session.has("alphaKey")) throw redirect("/");
  if (user.has("userId")) throw redirect("/alpha/dashboard");
  else return null;
};

export default function Index() {
  // const data = useActionData<typeof action>();
  const clientId = "1755f9594459f4e4030c";
  const redirectUri = "http://localhost:3000/gh-callback";
  function handleLogin() {
    const scope = "user:email";
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    return url;
  }

  return (
    <div className="w-screen h-screen overflow-hidden">
      {" "}
      <div className="relative left-0 w-full flex flex-col h-full items-center align-middle justify-center">
        <div className="h-auto w-auto relative border-2 border-black rounded p-10">
          <Link to={handleLogin()}>Log in with GitHub</Link>
        </div>
      </div>
    </div>
  );
}
