import { LoaderArgs, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { db } from "../db.server";
import { ApiKeys, User } from "database";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
} from "../utils/alphaSession";
import { App as Octo } from "octokit";

type UserWithApiKeys =
  | (User & {
      apiKeys: ApiKeys | null;
    })
  | null;
function getGithubPk() {
  const githubAppPk = process.env.appPK as string;
  const formattedGithubAppPk = githubAppPk.replace(/\\n/g, "\n");
  return formattedGithubAppPk;
}

const getUserRepositories = async (githubInstallationId: string) => {
  const octo = new Octo({ appId: "302483", privateKey: getGithubPk() });

  const octokit = await octo.getInstallationOctokit(parseInt(githubInstallationId));

  let repositories = await octokit.request("GET /installation/repositories", {
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  return repositories;
};
//TO DO: Make sure these functions are run serverside so that the github private key is not exposed

export const loader = async ({ request }: LoaderArgs) => {
  //validate session cookie
  const user = await userGetSession(request.headers.get("Cookie"));
  if (!user.has("userId")) throw redirect("/alpha/login");

  const userData: UserWithApiKeys = await db.user.findUnique({
    where: { id: user.get("userId") },
    include: { apiKeys: true },
  });

  return userData;
};

export default function Index() {
  const userData = useLoaderData<typeof loader>();

  return (
    <div className="w-screen h-screen overflow-hidden display flex flex-col">
      <div
        id="navbar"
        className="h-20 border-b border-b-black flex flex-row justify-between items-center"
      >
        <Link to="/" id="logo" className="text-5xl flex-1 pl-8 ">
          fether
        </Link>
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
        <div id="api-key" className="mt-20">
          <p></p>
          {!userData?.apiKey ? (
            <div>
              <h1 className="text-4xl">api key: </h1>
              <Form method="post" action="/keygen">
                <input type="hidden" name="userId" value={userData?.id} />
                <button type="submit" className="font-sans text-base ml-4 inline-block">
                  click here to generate api key
                </button>
              </Form>
            </div>
          ) : (
            <div>
              <p className="text-4xl">api key: {userData?.apiKey}</p>
              {!userData.githubInstallationId ? (
                <div>
                  <a
                    className="text-4xl"
                    href="https://github.com/apps/fetherkit/installations/new"
                    target="_blank"
                  >
                    click HERE to add Github FetherKit app
                  </a>
                </div>
              ) : (
                <div>
                  <p className="text-4xl">
                    current deployment repo Id: {userData.githubInstallationId}
                  </p>
                  {userData?.apiKeys?.contractAbi ? (
                    <div>
                      {" "}
                      <p>Contract ABI: {userData?.apiKeys?.contractAbi}</p>
                      <p>Contract Address: {userData?.apiKeys?.contractAddress}</p>
                    </div>
                  ) : (
                    <div>
                      <p>Push code to your chosen repository to view deployment details</p>
                    </div>
                  )}
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
