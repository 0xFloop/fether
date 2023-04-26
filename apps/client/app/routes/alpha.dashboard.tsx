import { ActionArgs, LoaderArgs, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { db } from "../db.server";
import { ApiKeys, User } from "database";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
} from "../utils/alphaSession";
import { getUserRepositories } from "../utils/octo.server";

type UserWithApiKeys =
  | (User & {
      apiKeys: ApiKeys | null;
    })
  | null;
type RepoData = { repoName: string; repoId: string };
//fix adding installationId to apiKey table
export const action = async ({ request }: ActionArgs) => {
  const body = await request.formData();
  const githubInstallationId = body.get("githubInstallationId");
  const chosenRepoName = body.get("chosenRepoName");
  if (chosenRepoName) {
    await db.apiKeys.upsert({
      where: { githubInstallationId: githubInstallationId as string },
      create: {
        keyTier: "FREE",
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        createdAt: new Date(),
        updatedAt: new Date(),
        githubInstallationId: githubInstallationId as string,
        repoName: chosenRepoName as string,
      },
      update: { repoName: chosenRepoName as string },
    });
    return { originCallForm: "chooseRepo", chosenRepoName: chosenRepoName, repositories: null };
  } else if (githubInstallationId && !chosenRepoName) {
    const repositories = await getUserRepositories(githubInstallationId as string);
    const repoArray = repositories.data.repositories;
    const repoObjArray: RepoData[] = [];
    repoArray.map((repo) => {
      repoObjArray.push({ repoName: repo.full_name, repoId: repo.id.toString() });
      console.log("repoName: ", repo.full_name + "; repoId: ", repo.id);
    });
    return { originCallForm: "getRepos", chosenRepoName: null, repositories: repoObjArray };
  }
  return { originCallForm: "unknown", chosenRepoName: null, repositories: null };
};

//TO DO: Make sure these functions are run serverside so that the github private key is not exposed

//TO DO: Make user install github app and select repository before generating api key so we can save the github installation id to the apiKey table

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
  const actionRepos = useActionData<typeof action>();

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
                  {!userData?.apiKeys?.repoName ? (
                    <div>
                      <Form method="post">
                        <input
                          type="hidden"
                          name="githubInstallationId"
                          value={userData.githubInstallationId}
                        />
                        <button type="submit">choose repository </button>
                      </Form>
                      {actionRepos?.originCallForm == "getRepos" && (
                        <Form method="post">
                          <input
                            type="hidden"
                            name="githubInstallationId"
                            value={userData.githubInstallationId}
                          />
                          <fieldset className="flex flex-col gap-3">
                            {actionRepos.repositories?.map((repo) => (
                              <label>
                                <input type="radio" name="chosenRepoName" value={repo.repoName} />
                                {repo.repoName}
                              </label>
                            ))}
                          </fieldset>
                          <button type="submit">submit</button>
                        </Form>
                      )}
                    </div>
                  ) : (
                    <div>
                      {" "}
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
          )}
        </div>
        <div id="github-repo"></div>
        <div id="analytics"></div>
      </div>
    </div>
  );
}
