import { ActionArgs, LoaderArgs, redirect } from "@vercel/remix";
import { Form, useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import { db } from "../utils/db.server";
import { getSession as userGetSession } from "../utils/alphaSession.server";
import { getRootDir, getSolFileNames, getUserRepositories } from "../utils/octo.server";
import { Loader, X, ChevronDown, Copy, Edit, CheckCircle } from "lucide-react";
import { deployContract } from "~/utils/viem.server";
import { AbiFunction as AbiFunctionType } from "abitype";
import { useState } from "react";
import {
  ContractReturn,
  callContractFunction,
  timeSince,
  sleep,
  getFunctionArgsFromInput,
  fetherChainFromKey,
} from "~/utils/helpers";
import * as Accordion from "@radix-ui/react-accordion";
import { useAccount, useBalance } from "wagmi";

import { RepoData, UserWithKeyRepoActivity } from "~/types";

import rainbowStylesUrl from "@rainbow-me/rainbowkit/styles.css";

export function links() {
  return [{ rel: "stylesheet", href: rainbowStylesUrl }];
}

import { CustomConnectButton } from "../components/ConnectButton";
import { createTestClient, http, parseEther } from "viem";
import SetupPage from "~/components/SetupPage";

//TODO: make sigin page better ui
//TODO: make setup wizard better ui
//TODO: fix call trace ui

//TODO: MAYBE break this one big ol action into many other action routes

export const action = async ({ request }: ActionArgs) => {
  const body = await request.formData();
  const githubInstallationId = body.get("githubInstallationId");
  const chosenRepoData = body.get("chosenRepoData");
  const associatedUser = await db.user.findUnique({
    where: { githubInstallationId: githubInstallationId as string },
    include: {
      ApiKey: true,
      Repository: {
        include: {
          Activity: true,
        },
      },
    },
  });

  if (associatedUser) {
    const formType = body.get("formType");
    switch (formType) {
      case "getAllRepos":
        console.log("getAllRepos");
        const repositories = await getUserRepositories(githubInstallationId as string);
        const repoArray = repositories.data.repositories;
        const repoObjArray: RepoData[] = [];
        repoArray.map((repo: any) => {
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
            update: {
              name: chosenRepoName as string,
              id: chosenRepoId as string,
              contractAbi: null,
              contractAddress: null,
              filename: null,
              foundryRootDir: null,
            },
          });
          await db.transaction.deleteMany({
            where: { repositoryId: associatedUser.Repository?.id as string },
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
        let foundryRootDir = associatedUser.Repository?.foundryRootDir;
        if (!foundryRootDir) {
          foundryRootDir = await getRootDir(githubInstallationId as string);
        }

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
            contractAbi: null,
            contractAddress: null,
          },
        });
        await db.transaction.deleteMany({
          where: { repositoryId: associatedUser.Repository?.id as string },
        });

        return {
          originCallForm: "chooseFileToTrack",
          chosenRepoName: null,
          repositories: null,
          solFilesFromChosenRepo: null,
          chosenFileName: body.get("chosenFileName"),
        };

      case "deployContract":
        await deployContract(githubInstallationId as string, associatedUser);

        return {
          originCallForm: "deployContract",
          chosenRepoName: null,
          repositories: null,
          solFilesFromChosenRepo: null,
          chosenFileName: null,
        };
      case "fundWallet":
        let currentBalance = body.get("currentBalance") as `${number}`;
        console.log("fundWallet");
        const adminClient = createTestClient({
          chain: fetherChainFromKey(associatedUser.ApiKey?.key as string),
          mode: "anvil",
          transport: http(),
        });
        await adminClient.setBalance({
          address: body.get("walletAddress") as `0x${string}`,
          value: parseEther("1") + parseEther(currentBalance),
        });
        return {
          originCallForm: "fundWallet",
          chosenRepoName: null,
          repositories: null,
          solFilesFromChosenRepo: null,
          chosenFileName: null,
        };

      case "setDeployerAddress":
        let newDeployerAddress = body.get("deployerAddress") as string;

        await db.repository.update({
          where: { userId: associatedUser.id },
          data: {
            deployerAddress: newDeployerAddress,
          },
        });
        return {
          originCallForm: "setDeployerAddress",
          chosenRepoName: null,
          repositories: null,
          solFilesFromChosenRepo: null,
          chosenFileName: null,
        };

      default:
        return {
          originCallForm: "",
          chosenRepoName: null,
          repositories: null,
          solFilesFromChosenRepo: null,
          chosenFileName: null,
        };
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
  const navigation = useNavigation();
  const submit = useSubmit();

  const { address, isConnected } = useAccount();
  const { data } = useBalance({ address });

  const [deployerModal, setDeployerModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [functionCalled, setFunctionCalled] = useState<string | null>(null);
  const [functionReturn, setFunctionReturn] = useState<ContractReturn>({
    methodName: "",
    returnItems: [],
  });

  let deployStatus = "Deploy";

  if (userData?.Repository?.Activity) {
    let activity = userData.Repository.Activity;

    for (let i = 0; i < activity.length; i++) {
      if (activity[i].functionName.includes("Deployment")) {
        deployStatus = "Redeploy";
        break;
      }
    }
  }

  const animateCopy = async () => {
    if (userData?.ApiKey) {
      navigator.clipboard.writeText(userData.ApiKey.key);
      setCopied(true);
      await sleep(2000);
      setCopied(false);
    }
  };

  return (
    <div className="w-screen h-auto min-h-screen overflow-hidden display flex flex-col pt-20 text-[#121212]">
      {!userData?.Repository?.contractAbi ? (
        <SetupPage userData={userData} navigation={navigation} actionArgs={actionArgs} />
      ) : (
        <div id="content" className="w-3/4 max-w-7xl mx-auto py-20 rounded-lg">
          <div className="text-4xl flex gap-10 flex-row justify-between rounded-lg">
            <div className="w-2/5">
              <div className="flex flex-col rounded-lg gap-10">
                <div className="text-xl gap-2 bg-[#F5F5F5] shadow-md	 p-5 flex flex-col rounded-lg">
                  <p className="pb-2 text-4xl">Details:</p>
                  <div className="flex flex-row justify-between rounded-lg">
                    <p className="text-2xl ">Api Key:</p>
                    <p className="flex flex-row items-center gap-2">
                      {userData?.ApiKey?.key.slice(0, 10)}••••
                      {userData?.ApiKey?.key.slice(20)}
                      <button className="transform active:scale-75 transition-transform">
                        {copied ? (
                          <CheckCircle size={20} />
                        ) : (
                          <Copy
                            size={20}
                            onClick={() => {
                              animateCopy();
                            }}
                          />
                        )}
                      </button>
                    </p>
                  </div>
                  <div className="flex flex-row justify-between rounded-lg">
                    <p className="text-2xl">Repository:</p>
                    <div className="flex flex-row items-center">
                      <p>{userData.Repository.name} &nbsp;</p>{" "}
                      <Form method="post">
                        <input
                          type="hidden"
                          name="githubInstallationId"
                          value={userData.githubInstallationId as string}
                        />
                        <input type="hidden" name="formType" value="getAllRepos" />
                        <button type="submit">
                          {navigation.state == "submitting" &&
                          navigation.formData.get("formType") == "getAllRepos" ? (
                            <div className="animate-spin">
                              <Loader size={20} />
                            </div>
                          ) : (
                            <Edit
                              className="transform active:scale-75 transition-transform"
                              size={20}
                            />
                          )}
                        </button>
                      </Form>
                    </div>
                    {actionArgs?.originCallForm == "getRepos" && (
                      <div className="absolute left-1/4 w-1/2 p-5 z-10 bg-[#f0f0f0] border border-[#121212] rounded-lg">
                        <div className="w-full justify-between flex flex-row">
                          <p className="text-2xl">Choose Repository:</p>
                          <Form method="post">
                            <input
                              type="hidden"
                              name="githubInstallationId"
                              value={userData.githubInstallationId as string}
                            />
                            <button type="submit">
                              <X />
                            </button>
                          </Form>
                        </div>
                        <Form method="post" className="mt-5">
                          <input
                            type="hidden"
                            name="githubInstallationId"
                            value={userData.githubInstallationId as string}
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

                          <button
                            type="submit"
                            className="text-[#f0f0f0] bg-[#121212] py-2 px-4 border rounded-lg"
                          >
                            {navigation.state == "submitting" &&
                            navigation.formData.get("formType") == "getChosenRepo" ? (
                              <p>Submitting....</p>
                            ) : (
                              <p>Submit</p>
                            )}
                          </button>
                        </Form>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-row justify-between rounded-lg">
                    <p className="text-2xl">Contract:</p>
                    <div className="flex flex-row items-center">
                      <p>{userData.Repository.filename} &nbsp;</p>{" "}
                      <div>
                        <Form method="post">
                          <input
                            type="hidden"
                            name="githubInstallationId"
                            value={userData.githubInstallationId as string}
                          />
                          <input type="hidden" name="formType" value="getFilesOfChosenRepo" />
                          <button type="submit">
                            {navigation.state == "submitting" &&
                            navigation.formData.get("formType") == "getFilesOfChosenRepo" ? (
                              <div className="animate-spin">
                                <Loader size={20} />
                              </div>
                            ) : (
                              <Edit
                                className="transform active:scale-75 transition-transform"
                                size={20}
                              />
                            )}
                          </button>
                        </Form>
                        {actionArgs?.originCallForm == "getFilesOfChosenRepo" && (
                          <div className="absolute left-1/4 w-1/2 p-5 z-10 bg-[#f0f0f0] border border-[#121212] rounded-lg">
                            <div className="w-full justify-between flex flex-row">
                              <p className="text-2xl">Choose File To Track:</p>
                              <Form method="post">
                                <input
                                  type="hidden"
                                  name="githubInstallationId"
                                  value={userData.githubInstallationId as string}
                                />
                                <button type="submit">
                                  <X />
                                </button>
                              </Form>
                            </div>
                            <Form method="post" className="mt-10">
                              <input
                                type="hidden"
                                name="githubInstallationId"
                                value={userData.githubInstallationId as string}
                              />
                              <input type="hidden" name="formType" value="chooseFileToTrack" />
                              <fieldset className="grid grid-cols-2">
                                {actionArgs.solFilesFromChosenRepo?.map((fileName, i) => (
                                  <label key={i} className="text-xl">
                                    <input type="radio" name="chosenFileName" value={fileName} />{" "}
                                    {fileName}
                                  </label>
                                ))}
                              </fieldset>
                              <br />
                              <button
                                type="submit"
                                className="text-[#f0f0f0] bg-[#121212] py-2 px-4 border rounded-lg"
                              >
                                {navigation.state == "submitting" &&
                                navigation.formData.get("formType") == "chooseFileToTrack" ? (
                                  <p>Submitting....</p>
                                ) : (
                                  <p>Submit</p>
                                )}
                              </button>
                            </Form>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row justify-between rounded-lg">
                    <p className="text-2xl">Deployer: </p>
                    <div className="flex flex-row items-center">
                      <p>
                        {userData?.Repository?.deployerAddress?.slice(0, 8)}••••
                        {userData?.Repository?.deployerAddress?.slice(37)} &nbsp;{" "}
                      </p>
                      <Form method="post">
                        <input
                          type="hidden"
                          name="githubInstallationId"
                          value={userData.githubInstallationId as string}
                        />
                        <button
                          onClick={() => {
                            if (actionArgs?.originCallForm == "setDeployerAddress") {
                              submit(null, { method: "post", action: "/" });
                            }
                            setDeployerModal(true);
                          }}
                        >
                          <Edit
                            className="transform active:scale-75 transition-transform"
                            size={20}
                          />
                        </button>
                      </Form>
                      {deployerModal && actionArgs?.originCallForm != "setDeployerAddress" && (
                        <div className="absolute left-1/4 w-1/2 p-5 z-10 bg-[#f0f0f0] border border-[#121212] rounded-lg">
                          <button onClick={() => setDeployerModal(false)} className="float-right ">
                            <X />
                          </button>
                          <Form method="post" className=" w-11/12">
                            <input
                              type="hidden"
                              name="githubInstallationId"
                              value={userData?.githubInstallationId?.toString()}
                            />
                            <input type="hidden" name="formType" value="setDeployerAddress" />
                            {navigation.state == "submitting" &&
                            navigation.formData.get("formType") == "setDeployerAddress" ? (
                              <div className="flex flex-row items-center">
                                Setting Deployer Address....
                                <div className="ml-5 animate-spin">
                                  <Loader size={20} />
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-row items-center justify-between w-full">
                                <input
                                  className="text-lg h-10 rounded-lg p-2 w-1/2 border border-[#121212]"
                                  name="deployerAddress"
                                  placeholder="Input desired contract deployer address"
                                />
                                <button
                                  className="text-[#f0f0f0] text-xl bg-[#121212] py-2 px-4 border rounded-lg"
                                  type="submit"
                                >
                                  Set Deployer Address
                                </button>
                              </div>
                            )}
                          </Form>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-row justify-between rounded-lg">
                    <p className="text-2xl">Last Deployment: </p>
                    <p>{timeSince(userData?.Repository?.updatedAt)} ago</p>
                  </div>
                </div>

                <div className="flex flex-col bg-[#F5F5F5] shadow-md	 p-5 rounded-lg">
                  <div className="flex flex-row justify-between">
                    <p>Functions: </p>
                    <div className="text-lg">
                      <CustomConnectButton />
                    </div>
                  </div>
                  {isConnected && data?.formatted && (
                    <div className="flex flex-row justify-between items-center rounded-lg">
                      <div className="text-xl relative w-full">
                        <Form method="post">
                          <input
                            type="hidden"
                            name="githubInstallationId"
                            value={userData.githubInstallationId as string}
                          />
                          <input type="hidden" name="formType" value="fundWallet" />
                          <input type="hidden" name="walletAddress" value={address} />
                          <input type="hidden" name="currentBalance" value={data?.formatted} />

                          {navigation.state == "submitting" &&
                          navigation.formData.get("formType") == "fundWallet" ? (
                            <div className="text-[#f0f0f0] bg-[#121212] py-2 mt-2 px-4 text-xl border rounded-lg flex flex-row items-center  float-right">
                              +1 FEth
                              <div className="animate-spin items-center ml-3">
                                <Loader size={20} />
                              </div>
                            </div>
                          ) : (
                            <button
                              type="submit"
                              className="text-[#f0f0f0] bg-[#121212] py-2 px-4 border rounded-lg mt-2 text-xl float-right"
                            >
                              Add FEth
                            </button>
                          )}
                        </Form>
                      </div>
                    </div>
                  )}

                  <ul className="flex flex-col gap-2 bg-[#F5F5F5]  rounded-lg">
                    <p className="text-2xl border-b border-b-[#121212]">Read</p>
                    <div className="py-2">
                      {JSON.parse(userData?.Repository?.contractAbi as string).map(
                        (method: AbiFunctionType, i: number) => (
                          <div key={i}>
                            {(method.stateMutability == "view" ||
                              method.stateMutability == "pure") && (
                              <li className="text-lg py-1">
                                <div className="flex flex-row justify-between items-center">
                                  {JSON.stringify(method["name"]).replace(/['"]+/g, "")}
                                  <button
                                    onClick={async () => {
                                      setFunctionCalled(method.name);

                                      let returnedData = await callContractFunction(
                                        method,
                                        userData?.Repository?.contractAbi as string,
                                        userData?.Repository?.contractAddress as `0x${string}`,
                                        getFunctionArgsFromInput(method),
                                        userData?.ApiKey?.key as string
                                      );
                                      setFunctionCalled(null);

                                      setFunctionReturn(returnedData);
                                    }}
                                    className="text-[#f0f0f0] bg-[#121212] py-2 px-4 border rounded-lg"
                                  >
                                    {functionCalled == method.name ? (
                                      <div className="flex flex-row items-center">
                                        <p>Calling</p>{" "}
                                        <div className="animate-spin ml-2">
                                          {" "}
                                          <Loader size={20} />
                                        </div>
                                      </div>
                                    ) : (
                                      <>Call</>
                                    )}
                                  </button>
                                </div>
                                {functionReturn.methodName == method.name &&
                                  method.outputs.length > 0 && (
                                    <>
                                      <p>Returned:</p>
                                      {method.outputs.map((output, index) => (
                                        <div
                                          key={index}
                                          className="bg-transparent w-1/3 rounded-lg flex flex-row"
                                        >
                                          <p>
                                            &nbsp;&nbsp;
                                            {functionReturn.returnItems[index].name}:{" "}
                                          </p>
                                          <p>
                                            &nbsp;&nbsp;
                                            {functionReturn.returnItems[index].value}
                                          </p>
                                        </div>
                                      ))}
                                    </>
                                  )}
                              </li>
                            )}
                          </div>
                        )
                      )}
                    </div>
                    <p className="text-2xl border-b border-b-[#121212]">Write</p>

                    {JSON.parse(userData?.Repository?.contractAbi).map(
                      (method: AbiFunctionType, i: number) => (
                        <div key={i}>
                          {!(
                            method.stateMutability == "view" || method.stateMutability == "pure"
                          ) && (
                            <li className="text-lg">
                              <>
                                <Accordion.Root type="multiple" className="w-full relative py-2">
                                  <Accordion.Item
                                    key={method.name}
                                    value={method.name as string}
                                    className=""
                                  >
                                    {method.inputs.length > 0 ? (
                                      <Accordion.Trigger className="group">
                                        <p>{method.name}</p>
                                        <div className="absolute  right-0 top-0  transition-transform group-data-[state=open]:rotate-180">
                                          <ChevronDown
                                            size={40}
                                            strokeWidth={1.25}
                                            strokeLinecap="round"
                                            className="w-16"
                                          />
                                        </div>
                                      </Accordion.Trigger>
                                    ) : (
                                      <div className="flex flex-row justify-between items-center">
                                        <p>{method.name}</p>
                                        <button
                                          onClick={async () => {
                                            if (Boolean(address)) {
                                              setFunctionCalled(method.name);
                                              try {
                                                let returnedData = await callContractFunction(
                                                  method,
                                                  userData?.Repository?.contractAbi as string,
                                                  userData?.Repository
                                                    ?.contractAddress as `0x${string}`,
                                                  getFunctionArgsFromInput(method),
                                                  userData?.ApiKey?.key as string
                                                );
                                                setFunctionCalled(null);

                                                setFunctionReturn(returnedData);
                                              } catch (error) {
                                                setFunctionCalled(null);
                                              }
                                            }
                                          }}
                                          className="text-[#f0f0f0] bg-[#121212] py-2 px-4 border rounded-lg disabled:bg-[#cbcbcb]"
                                          disabled={!Boolean(address)}
                                        >
                                          {functionCalled == method.name ? (
                                            <div className="flex flex-row items-center">
                                              <p>Calling</p>{" "}
                                              <div className="animate-spin ml-2">
                                                {" "}
                                                <Loader size={20} />
                                              </div>
                                            </div>
                                          ) : (
                                            <>Call</>
                                          )}
                                        </button>
                                      </div>
                                    )}
                                    {method.inputs.length > 0 && (
                                      <Accordion.Content>
                                        <div className="flex flex-row justify-between mt-4">
                                          <div className="flex flex-col mt-2 gap-2">
                                            {method.inputs.map((input) => (
                                              <input
                                                key={input.name}
                                                id={`${method.name}-${input.name}`}
                                                className="bg-transparent rounded-lg"
                                                type="text"
                                                placeholder={`${input.type}: ${input.name}`}
                                              />
                                            ))}{" "}
                                          </div>
                                          <button
                                            onClick={async () => {
                                              if (Boolean(address)) {
                                                setFunctionCalled(method.name);
                                                try {
                                                  let returnedData = await callContractFunction(
                                                    method,
                                                    userData?.Repository?.contractAbi as string,
                                                    userData?.Repository
                                                      ?.contractAddress as `0x${string}`,
                                                    getFunctionArgsFromInput(method),
                                                    userData?.ApiKey?.key as string
                                                  );
                                                  setFunctionCalled(null);

                                                  setFunctionReturn(returnedData);
                                                } catch (error) {
                                                  setFunctionCalled(null);
                                                }
                                              }
                                            }}
                                            className="text-[#f0f0f0] bg-[#121212] py-2 px-4 border rounded-lg disabled:bg-[#cbcbcb]"
                                            disabled={!Boolean(address)}
                                          >
                                            {functionCalled == method.name ? (
                                              <div className="flex flex-row items-center">
                                                <p>Calling</p>{" "}
                                                <div className="animate-spin ml-2">
                                                  {" "}
                                                  <Loader size={20} />
                                                </div>
                                              </div>
                                            ) : (
                                              <>Call</>
                                            )}
                                          </button>
                                        </div>
                                      </Accordion.Content>
                                    )}
                                  </Accordion.Item>
                                </Accordion.Root>
                              </>
                              {functionReturn.methodName == method.name &&
                                method.outputs.length > 0 && (
                                  <>
                                    <p>Returned:</p>
                                    {method.outputs.map((output, index) => (
                                      <div
                                        key={index}
                                        className="bg-transparent w-1/3 rounded-lg flex flex-row"
                                      >
                                        <p>
                                          &nbsp;&nbsp;
                                          {functionReturn.returnItems[index].name}:{" "}
                                        </p>
                                        <p>
                                          &nbsp;&nbsp;
                                          {functionReturn.returnItems[index].value}
                                        </p>
                                      </div>
                                    ))}
                                  </>
                                )}
                            </li>
                          )}
                        </div>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex flex-col w-3/5 gap-10">
              <div className="flex-1  bg-[#F5F5F5] shadow-md	 p-5 rounded-lg ">
                <div className="flex flex-row justify-between items-center">
                  <p className="pb-2">Transactions:</p>

                  <Form method="post">
                    <input
                      type="hidden"
                      name="githubInstallationId"
                      value={userData.githubInstallationId?.toString() as string}
                    />
                    <input type="hidden" name="formType" value="deployContract" />

                    <button
                      className="text-xl text-[#f0f0f0] bg-[#121212] py-2 px-4 rounded-lg"
                      type="submit"
                    >
                      {navigation.state == "submitting" &&
                      navigation.formData.get("formType") == "deployContract" ? (
                        <div className="flex flex-row items-center">
                          <p>Deploying</p>{" "}
                          <div className="animate-spin ml-2">
                            {" "}
                            <Loader size={20} />
                          </div>
                        </div>
                      ) : (
                        <p>{deployStatus}</p>
                      )}
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
                    {userData?.Repository?.Activity?.map((transaction: any, i) => (
                      <tr key={i} className="">
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
                          <p className="text-lg">{timeSince(transaction.timestamp)} ago</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
