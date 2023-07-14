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
    <div className="w-screen h-screen relative flex items-center justify-center">
      <div className="w-[500px] relative flex flex-col items-center px-10 py-20 border-x-2 border-black">
        <img
          className="w-16 absolute top-0 left-0"
          src="/images/fetherBlackTransparent.svg"
          alt="fether logo"
        />
        <h1 className="text-xl mt-10">
          Fether utilizes Log In With GitHub to streamline the GitHub integration necessary for
          continuous contract tracking.
        </h1>
        <Form method="post">
          <button className="mt-10 px-10 py-5 border-2 border-black rounded" type="submit">
            Log in with GitHub
          </button>
        </Form>
      </div>
    </div>
  );
}
