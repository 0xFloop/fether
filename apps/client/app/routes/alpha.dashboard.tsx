import { ActionArgs, LoaderArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { db } from "../db.server";
import { ApiKey, Repository, User, Transaction } from "database";
import { getSession as userGetSession } from "../utils/alphaSession.server";
import { getRootDir, getSolFileNames, getUserRepositories } from "../utils/octo.server";
import { Copy } from "lucide-react";
import { deployContract } from "~/utils/viem.server";
import { Abi, AbiFunction } from "abitype";

type UserWithKeyRepoActivity =
  | (User & {
      ApiKey: ApiKey | null;
      Repository:
        | (Repository & {
            Activity: Transaction[] | null;
          })
        | null;
    })
  | null;

type RepoData = { repoName: string; repoId: string };

//TODO: Write the deploy contract function upon file selection
//TODO: MAYBE HAVE TO ALLOW USER TO INPUT THE SOURCE CONTRACTS PATH

var timeSince = function (_date: any) {
  var date = Date.parse(_date);
  //@ts-ignore
  var seconds = Math.floor((new Date() - date) / 1000);
  var intervalType;

  var interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    intervalType = "year";
  } else {
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      intervalType = "month";
    } else {
      interval = Math.floor(seconds / 86400);
      if (interval >= 1) {
        intervalType = "day";
      } else {
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) {
          intervalType = "hour";
        } else {
          interval = Math.floor(seconds / 60);
          if (interval >= 1) {
            intervalType = "minute";
          } else {
            interval = seconds;
            intervalType = "second";
          }
        }
      }
    }
  }

  if (interval > 1 || interval === 0) {
    intervalType += "s";
  }

  return interval + " " + intervalType;
};
export const action = async ({ request }: ActionArgs) => {
  const body = await request.formData();
  const formType = body.get("formType");
  const githubInstallationId = body.get("githubInstallationId");
  const chosenRepoData = body.get("chosenRepoData");
  const associatedUser = await db.user.findUnique({
    where: { githubInstallationId: githubInstallationId as string },
    include: { ApiKey: true, Repository: true },
  });

  if (associatedUser) {
    switch (formType) {
      case "getAllRepos":
        console.log("getAllRepos");
        const repositories = await getUserRepositories(githubInstallationId as string);
        const repoArray = repositories.data.repositories;
        const repoObjArray: RepoData[] = [];
        repoArray.map((repo) => {
          repoObjArray.push({ repoName: repo.full_name, repoId: repo.id.toString() });
        });
        return {
          originCallForm: "getRepos",
          chosenRepoName: null,
          repositories: repoObjArray,
          solFilesFromChosenRepo: null,
          chosenFileName: null,
        };

      case "getChosenRepo":
        console.log("getChosenRepo");
        if (chosenRepoData) {
          const chosenRepoName = chosenRepoData.toString().split(",")[0];
          const chosenRepoId = chosenRepoData.toString().split(",")[1];

          await db.repository.upsert({
            where: { userId: associatedUser.id },
            create: {
              id: chosenRepoId as string,
              name: chosenRepoName as string,
              userId: associatedUser.id,
            },
            update: { name: chosenRepoName as string, id: chosenRepoId as string },
          });
          return {
            originCallForm: "chooseRepo",
            chosenRepoName: chosenRepoName,
            repositories: null,
            solFilesFromChosenRepo: null,
            chosenFileName: null,
          };
        }

      case "getFilesOfChosenRepo":
        let foundryRootDir = await getRootDir(githubInstallationId as string);

        let fileNameArray: string[] = await getSolFileNames(
          githubInstallationId as string,
          foundryRootDir as string
        );
        return {
          originCallForm: "getFilesOfChosenRepo",
          chosenRepoName: null,
          repositories: null,
          solFilesFromChosenRepo: fileNameArray,
          chosenFileName: null,
        };

      case "chooseFileToTrack":
        console.log("chooseFileToTrack");

        await db.repository.update({
          where: { userId: associatedUser.id },
          data: {
            filename: body.get("chosenFileName") as string,
          },
        });

        return {
          originCallForm: "chooseFileToTrack",
          chosenRepoName: null,
          repositories: null,
          solFilesFromChosenRepo: null,
          chosenFileName: body.get("chosenFileName"),
        };

      case "deployContract":
        console.log("deployContract");

        await deployContract(githubInstallationId as string);

        return {
          originCallForm: "deployContract",
          chosenRepoName: null,
          repositories: null,
          solFilesFromChosenRepo: null,
          chosenFileName: null,
        };

      default:
        return;
    }
  } else {
    console.log("user not found");
  }
};

export const loader = async ({ request }: LoaderArgs) => {
  //validate session cookie
  const user = await userGetSession(request.headers.get("Cookie"));
  if (!user.has("userId")) throw redirect("/alpha/login");

  const userData: UserWithKeyRepoActivity = await db.user.findUnique({
    where: { id: user.get("userId") },
    include: {
      ApiKey: true,
      Repository: {
        include: {
          Activity: {
            orderBy: {
              timestamp: "desc",
            },
          },
        },
      },
    },
  });

  return userData;
};

export default function Index() {
  const userData = useLoaderData<typeof loader>();
  const actionArgs = useActionData<typeof action>();

  return (
    <div className="w-screen h-auto overflow-hidden display flex flex-col">
      <div id="content" className="w-3/4 max-w-7xl mx-auto py-20 rounded-lg">
        {!userData?.ApiKey ? (
          <div className="text-4xl border-b bg-[#F5F5F5] p-5 flex flex-row justify-between rounded-lg">
            <p>Api Key:</p>
            <Form method="post" action="/keygen">
              <input type="hidden" name="userId" value={userData?.id} />
              <input type="hidden" name="formType" value="generateApiKey" />
              <button type="submit">Click here to generate api key</button>
            </Form>
          </div>
        ) : (
          <div>
            <div className="text-4xl border-b  bg-[#F5F5F5] p-5 flex flex-row justify-between rounded-lg">
              <p>Api Key:</p>
              <p className="flex flex-row items-center gap-2">
                {userData?.ApiKey.key}
                <button className="transform active:scale-75 transition-transform">
                  <Copy
                    size={30}
                    onClick={() => {
                      if (userData.ApiKey) {
                        navigator.clipboard.writeText(userData.ApiKey.key);
                      }
                    }}
                  />
                </button>
              </p>
            </div>
            {!userData.githubInstallationId ? (
              <div className="text-4xl  bg-[#F5F5F5] p-5 flex flex-row justify-between rounded-lg mt-10">
                <a href="https://github.com/apps/fetherkit/installations/new" target="_blank">
                  Click to add github FetherKit app
                </a>
              </div>
            ) : (
              <div>
                {!userData?.Repository ? (
                  <div>
                    <div className="text-4xl mt-10 border-b  bg-[#F5F5F5] p-5 flex flex-col justify-between rounded-lg">
                      <Form method="post">
                        <input
                          type="hidden"
                          name="githubInstallationId"
                          value={userData.githubInstallationId}
                        />
                        <input type="hidden" name="formType" value="getAllRepos" />
                        <button type="submit">Click to choose repository</button>
                      </Form>
                      {actionArgs?.originCallForm == "getRepos" && (
                        <>
                          <Form method="post" className="mt-10">
                            <input
                              type="hidden"
                              name="githubInstallationId"
                              value={userData.githubInstallationId}
                            />
                            <input type="hidden" name="formType" value="getChosenRepo" />

                            <fieldset className="grid grid-cols-2">
                              {actionArgs.repositories?.map((repo) => (
                                <label key={repo.repoName} className="text-xl">
                                  <input
                                    type="radio"
                                    name="chosenRepoData"
                                    value={[repo.repoName, repo.repoId]}
                                  />{" "}
                                  {repo.repoName}
                                </label>
                              ))}
                            </fieldset>
                            <br />
                            <button type="submit">Submit</button>
                          </Form>
                        </>
                      )}{" "}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl  bg-[#F5F5F5] p-5 flex flex-row justify-between rounded-lg mt-10">
                      <p>Repository:</p> <p>{userData.Repository.name}</p>
                    </div>
                    {userData?.Repository?.filename ? (
                      <>
                        <div className="text-4xl  bg-[#F5F5F5] p-5 flex flex-row justify-between rounded-lg mt-10">
                          <p>Contract:</p> <p>{userData.Repository.filename}</p>
                        </div>

                        {userData?.Repository?.contractAbi ? (
                          <div className="text-4xl flex gap-10 flex-row justify-between rounded-lg mt-10">
                            <div className="w-2/5">
                              <div className="flex flex-col gap-2  bg-[#F5F5F5] p-5 rounded-lg ">
                                <p>Contract ABI Methods: </p>

                                <ul className="flex flex-col gap-2">
                                  {JSON.parse(userData?.Repository?.contractAbi).map(
                                    (method: AbiFunction, i: number) => (
                                      <li key={i} className="text-lg">
                                        {JSON.stringify(method["name"]).replace(/['"]+/g, "")}
                                        {method.inputs.length > 0 && (
                                          <>
                                            {method.inputs.map((input) => (
                                              <input type="text" placeholder={input.name} />
                                            ))}
                                            <button>Call</button>
                                          </>
                                        )}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                              <br />
                              <div className="flex flex-col gap-2  bg-[#F5F5F5] p-5 rounded-lg ">
                                <p>Last Deployment:</p>
                                <p className="text-lg">
                                  {new Date(userData?.Repository?.updatedAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex-1  bg-[#F5F5F5] p-5 rounded-lg ">
                              <div className="flex flex-row justify-between items-center">
                                <p className="pb-2">Recent Transactions:</p>

                                <Form method="post">
                                  <input
                                    type="hidden"
                                    name="githubInstallationId"
                                    value={userData.githubInstallationId}
                                  />
                                  <input type="hidden" name="formType" value="deployContract" />
                                  <button
                                    type="submit"
                                    className="text-xl border-2 border-black py-2 px-4"
                                  >
                                    Redeploy
                                  </button>
                                </Form>
                              </div>
                              <table className="table-fixed w-full mt-5">
                                <thead>
                                  <tr className="text-left">
                                    <th className="text-lg">Tx Hash</th>
                                    <th className="text-lg">Function Name</th>
                                    <th className="text-lg">Timestamp</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {userData?.Repository?.Activity?.map((transaction: any) => (
                                    <tr key={transaction} className="">
                                      <td>
                                        <a
                                          href={`http://localhost:3003/${transaction.txHash}`}
                                          target="_blank"
                                          className="text-lg block underline"
                                        >
                                          {transaction.txHash.slice(0, 12)}...
                                        </a>
                                      </td>
                                      <td>
                                        <p className="text-lg">{transaction.functionName}</p>
                                      </td>
                                      <td>
                                        <p className="text-lg">
                                          {timeSince(transaction.timestamp)} ago
                                        </p>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="text-4xl  bg-[#F5F5F5] p-5 flex flex-row justify-between rounded-lg mt-10">
                            <Form method="post">
                              <input
                                type="hidden"
                                name="githubInstallationId"
                                value={userData.githubInstallationId}
                              />
                              <input type="hidden" name="formType" value="deployContract" />
                              <button type="submit">Click here to deploy your contract</button>
                            </Form>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-4xl border-b  bg-[#F5F5F5] p-5 flex flex-col justify-between rounded-lg mt-10">
                        {actionArgs?.originCallForm != "chooseFileToTrack" &&
                          !userData?.Repository.filename && (
                            <>
                              <Form method="post">
                                <input
                                  type="hidden"
                                  name="githubInstallationId"
                                  value={userData.githubInstallationId}
                                />
                                <input type="hidden" name="formType" value="getFilesOfChosenRepo" />
                                <button type="submit">
                                  Click to select which solidity file to track
                                </button>
                              </Form>
                              {actionArgs?.originCallForm == "getFilesOfChosenRepo" && (
                                <>
                                  <Form method="post" className="mt-10">
                                    <input
                                      type="hidden"
                                      name="githubInstallationId"
                                      value={userData.githubInstallationId}
                                    />
                                    <input
                                      type="hidden"
                                      name="formType"
                                      value="chooseFileToTrack"
                                    />
                                    <fieldset className="grid grid-cols-2">
                                      {actionArgs.solFilesFromChosenRepo?.map((fileName) => (
                                        <label className="text-xl">
                                          <input
                                            type="radio"
                                            name="chosenFileName"
                                            value={fileName}
                                          />
                                          {fileName}
                                        </label>
                                      ))}
                                    </fieldset>
                                    <br />
                                    <button type="submit">Submit</button>
                                  </Form>
                                </>
                              )}
                            </>
                          )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
