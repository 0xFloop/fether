import { ActionArgs, LoaderArgs, json, redirect } from "@vercel/remix";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { db } from "../utils/db.server";
import { getSession, commitSession } from "../utils/alphaAccessKeySession.server";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
} from "../utils/alphaSession.server";

export const loader = async ({ request }: LoaderArgs) => {
  let redirectUri = process.env.fetherGithubRedirectUri as string;
  const session = await getSession(request.headers.get("Cookie"));
  const user = await userGetSession(request.headers.get("Cookie"));
  if (!session.has("alphaKey")) throw redirect("/");
  if (user.has("userId")) throw redirect("/alpha/dashboard");
  else return redirectUri;
};
export const action = async ({ request }: ActionArgs) => {
  const clientId = process.env.fetherGithubOAuthClientId as string;
  const redirectUri = process.env.fetherGithubRedirectUri as string;
  const scope = "user:email";
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  return redirect(url);
};
export default function Index() {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <div className="relative w-full flex flex-col h-full items-center align-middle justify-center">
        <div className="h-auto w-auto relative border-2 border-black rounded p-10">
          <Form method="post">
            <button type="submit">Log in with GitHub</button>
          </Form>
        </div>
      </div>
    </div>
  );
}
