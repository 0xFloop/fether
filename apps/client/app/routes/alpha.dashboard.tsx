import { ActionArgs, LoaderArgs, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { db } from "../db.server";
import { ApiKey, Repository, User } from "database";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
} from "../utils/alphaSession";
import { getUserRepositories } from "../utils/octo.server";

type UserWithKeyAndRepo =
  | (User & {
      ApiKey: ApiKey | null;
      Repository: Repository | null;
    })
  | null;
type RepoData = { repoName: string; repoId: string };
//fix adding installationId to apiKey table
export const action = async ({ request }: ActionArgs) => {
  const body = await request.formData();
  const githubInstallationId = body.get("githubInstallationId");
  const chosenRepoName = body.get("chosenRepoName");
  const chosenRepoId = body.get("chosenRepoId");
  const associatedUser = await db.user.findUnique({
    where: { githubInstallationId: githubInstallationId as string },
    include: { ApiKey: true, Repository: true },
  });

  if (chosenRepoName && associatedUser) {
    await db.repository.upsert({
      where: { userId: associatedUser.id },
      create: {
        id: chosenRepoId as string,
        name: chosenRepoName as string,
        userId: associatedUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      update: { name: chosenRepoName as string, id: chosenRepoId as string },
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

//TO DO: fix adding installationId to apiKey table when user installs app

//TO DO: Make user install github app and select repository before generating api key so we can save the github installation id to the apiKey table

export const loader = async ({ request }: LoaderArgs) => {
  //validate session cookie
  const user = await userGetSession(request.headers.get("Cookie"));
  if (!user.has("userId")) throw redirect("/alpha/login");

  const userData: UserWithKeyAndRepo = await db.user.findUnique({
    where: { id: user.get("userId") },
    include: { ApiKey: true, Repository: true },
  });

  return userData;
};

export default function Index() {
  const userData = useLoaderData<typeof loader>();
  const actionRepos = useActionData<typeof action>();

  return (
    <div className="w-screen h-auto overflow-hidden display flex flex-col">
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
          {!userData?.ApiKey ? (
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
              <p className="text-4xl">api key: {userData?.ApiKey.key}</p>
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
                  {!userData?.Repository ? (
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
                          <fieldset className="flex flex-col">
                            {actionRepos.repositories?.map((repo) => (
                              <label>
                                <input type="radio" name="chosenRepoName" value={repo.repoName} />
                                <input type="hidden" name="chosenRepoId" value={repo.repoId} />
                                {repo.repoName}
                              </label>
                            ))}
                          </fieldset>
                          <button type="submit">
                            submitsubmitsubmitsubmitsubmitsubmitsubmitsubmitsubmit
                          </button>
                        </Form>
                      )}
                    </div>
                  ) : (
                    <div>
                      {" "}
                      <p className="text-4xl">
                        current deployment repo Id: {userData.githubInstallationId}
                      </p>
                      {userData?.Repository?.contractAbi ? (
                        <div>
                          {" "}
                          <p>Contract ABI: {userData?.Repository?.contractAbi}</p>
                          <p>Contract Address: {userData?.Repository?.contractAddress}</p>
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
