import { LoaderArgs, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { db } from "../db.server";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
} from "../utils/alphaSession";

export const loader = async ({ request }: LoaderArgs) => {
  //validate session cookie
  const user = await userGetSession(request.headers.get("Cookie"));
  if (!user.has("userId")) throw redirect("/alpha/login");

  let userData = await db.user.findUnique({ where: { id: user.get("userId") } });
  let apiKey;
  if (userData?.apiKey) {
    apiKey = await db.apiKeys.findUnique({ where: { key: userData?.apiKey } });
  } else {
    apiKey = null;
  }

  return { userData, apiKey };
};

export default function Index() {
  const { userData, apiKey } = useLoaderData();

  return (
    <div className="w-screen h-screen overflow-hidden display flex flex-col">
      <div
        id="navbar"
        className="h-20 border-b border-b-black flex flex-row justify-between items-center"
      >
        <h2 id="logo" className="text-5xl flex-1 pl-8 ">
          fether
        </h2>
        <div id="nav-links" className="flex flex-row justify-between gap-3 flex-1">
          <a href="/alpha/dashboard">dashboard</a>
          <a href="/alpha/documentation">documentation</a>
          <a href="/alpha/contact">contact</a>
        </div>
        <div className="flex-1  pr-8">
          <button id="signout" className="float-right">
            signout
          </button>
        </div>
      </div>
      <div id="content" className="w-full max-w-7xl mx-auto border">
        {userData.username}
        <div id="api-key" className="mt-20">
          {!apiKey && (
            <div>
              <h1 className="text-4xl">api key: </h1>
              <Form method="post" action="/keygen">
                <input type="hidden" name="userId" value={userData.id} />
                <button type="submit" className="font-sans text-base ml-4 inline-block">
                  click here to generate api key
                </button>
              </Form>
            </div>
          )}
          {apiKey && (
            <div>
              <p className="text-4xl">api key: {apiKey.key}</p>
              <p className="text-4xl">GH installation id: {apiKey.githubId}</p>
              <a
                className="text-4xl"
                href="https://github.com/apps/fetherkit/installations/new"
                target="_blank"
              >
                click HERE to add Github FetherKit app
              </a>
              {apiKey.repoName && (
                <div>
                  <p>{apiKey.repoName}</p>
                  <p className="text-4xl">current deployment repo: {apiKey.repoName}</p>
                  <p>{apiKey.contractAbi}</p>
                  <p>{apiKey.sourceCode}</p>
                </div>
              )}
            </div>
          )}
        </div>
        <div id="github-repo"></div>
        <div id="analytics"></div>
      </div>
    </div>
  );
}
