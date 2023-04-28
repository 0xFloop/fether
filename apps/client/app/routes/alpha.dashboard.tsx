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

export const action = async ({ request }: ActionArgs) => {
  const body = await request.formData();
  const githubInstallationId = body.get("githubInstallationId");
  const chosenRepoData = body.get("chosenRepoData");
  const associatedUser = await db.user.findUnique({
    where: { githubInstallationId: githubInstallationId as string },
    include: { ApiKey: true, Repository: true },
  });
  if (chosenRepoData && associatedUser) {
    const chosenRepoName = chosenRepoData.toString().split(",")[0];
    const chosenRepoId = chosenRepoData.toString().split(",")[1];
    console.log("chosenRepoName: ", chosenRepoName);
    console.log("chosenRepoId: ", chosenRepoId);
    await db.repository.upsert({
      where: { userId: associatedUser.id },
      create: {
        id: chosenRepoId as string,
        name: chosenRepoName as string,
        userId: associatedUser.id,
      },
      update: { name: chosenRepoName as string, id: chosenRepoId as string },
    });
    return { originCallForm: "chooseRepo", chosenRepoName: chosenRepoName, repositories: null };
  } else if (githubInstallationId && !chosenRepoData) {
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
      <div id="content" className="w-3/4 max-w-7xl mx-auto pt-20 rounded-lg">
        {!userData?.ApiKey ? (
          <div className="text-4xl border-b bg-slate-200 p-5">
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
            <div className="text-4xl border-b bg-slate-200 p-5 flex flex-row justify-between rounded-lg">
              <p>api key:</p> <p>{userData?.ApiKey.key}</p>
            </div>
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
                  <div className="text-4xl border-b bg-slate-200 p-5 flex flex-row justify-between rounded-lg">
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
                              <input
                                type="radio"
                                name="chosenRepoData"
                                value={[repo.repoName, repo.repoId]}
                              />
                              {repo.repoName} {repo.repoId}
                            </label>
                          ))}
                        </fieldset>
                        <button type="submit">submit</button>
                      </Form>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl bg-slate-200 p-5 flex flex-row justify-between rounded-lg mt-10">
                      <p>current deployment repository:</p> <p>{userData.Repository.name}</p>
                    </div>
                    {userData?.Repository?.contractAbi ? (
                      <div className="text-4xl flex gap-10 flex-row justify-between rounded-lg mt-10">
                        <div className="w-2/5">
                          <div className="flex flex-col gap-2 bg-slate-200 p-5 rounded-lg ">
                            <p>Contract ABI Methods: </p>

                            <ul className="flex flex-col gap-2">
                              {JSON.parse(userData?.Repository?.contractAbi).map((method: any) => (
                                <li className="text-lg">
                                  {JSON.stringify(method["name"]).replace(/['"]+/g, "")}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <br />
                          <div className="flex flex-col gap-2 bg-slate-200 p-5 rounded-lg ">
                            <p>Last Deployment:</p>
                            <p className="text-lg">
                              {new Date(userData?.Repository?.updatedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex-1 bg-slate-200 p-5 rounded-lg ">
                          Recent Transactions:
                        </div>
                      </div>
                    ) : (
                      <div className="text-4xl border-b bg-slate-200 p-5 flex flex-row justify-between rounded-lg mt-10">
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
  );
}
