import { ActionArgs, LinksFunction, LoaderArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation, useTransition } from "@remix-run/react";
import { db } from "../db.server";
import { ApiKey, Repository, User, Transaction } from "database";
import { getSession as userGetSession } from "../utils/alphaSession.server";
import { getRootDir, getSolFileNames, getUserRepositories } from "../utils/octo.server";
import { Loader, X, ChevronDown, Copy, Edit, CheckCircle } from "lucide-react";
import { deployContract } from "~/utils/viem.server";
import { AbiFunction as AbiFunctionType } from "abitype";
import { useState } from "react";
import { ContractReturn, callContractFunction, timeSince, sleep } from "~/utils/helpers";
import * as Accordion from "@radix-ui/react-accordion";
import { ConnectKitProvider, ConnectKitButton, getDefaultConfig } from "connectkit";

import {
  WagmiConfig,
  createConfig,
  configureChains,
  Chain,
  useAccount,
  useDisconnect,
  useConnect,
} from "wagmi";
import { publicProvider } from "wagmi/providers/public";

//TODO: USE THE CONNECTED WALLET NOT FORCED INJECTED WALLET
//TODO: ADD SETTING AND USING THE DEPLOYER ADDRESS

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

//TODO: MAYBE break this big ol action into many other action routes

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
        await deployContract(githubInstallationId as string);

        return {
          originCallForm: "deployContract",
          chosenRepoName: null,
          repositories: null,
          solFilesFromChosenRepo: null,
          chosenFileName: null,
        };
      case "clearActionArgs":
        return {
          originCallForm: "",
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

const getFunctionArgsFromInput = (abiFunction: AbiFunctionType): any[] => {
  let args = [];
  for (let i = 0; i < abiFunction.inputs.length; i++) {
    const inputElement = document.getElementById(
      `${abiFunction.name}-${abiFunction.inputs[i].name}`
    ) as HTMLInputElement;

    const val = inputElement.value;

    args.push(val);
  }

  return args;
};

export default function Index() {
  const animateCopy = async () => {
    if (userData?.ApiKey) {
      navigator.clipboard.writeText(userData.ApiKey.key);
      setCopied(true);
      await sleep(2000);
      setCopied(false);
    }
  };
  const userData = useLoaderData<typeof loader>();
  const actionArgs = useActionData<typeof action>();
  const navigation = useNavigation();
  const [copied, setCopied] = useState(false);

  const fetherChain: Chain = {
    id: 696969,
    name: "Fether",
    network: "fether",
    nativeCurrency: {
      decimals: 18,
      name: "Fether",
      symbol: "FEth",
    },
    rpcUrls: {
      default: {
        http: [`https://fether-testing.ngrok.app/rpc/${userData?.ApiKey?.key as string}`],
      },
      public: { http: [`https://fether-testing.ngrok.app/rpc/${userData?.ApiKey?.key as string}`] },
    },
    testnet: false,
  };

  const { chains, publicClient } = configureChains([fetherChain], [publicProvider()]);

  const config = createConfig(
    getDefaultConfig({
      alchemyId: "r8ilH_ju-8gNnskLhLGNGtIYpVwaIvOO", // or infuraId
      walletConnectProjectId: "42490798ad26dff0d5bfc67ee7abf1fb",
      chains,
      // Required
      appName: "Fether",

      // Optional
      appUrl: "https://fether.xyz", // your app's url
    })
  );

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

  const [functionReturn, setFunctionReturn] = useState<ContractReturn>({
    methodName: "",
    returnItems: [],
  });

  const { address, isConnecting, isDisconnected, isConnected } = useAccount();

  return (
    <WagmiConfig config={config}>
      <ConnectKitProvider>
        <div className="w-screen h-auto overflow-hidden display flex flex-col">
          {!userData?.Repository?.contractAbi ? (
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
                        {copied ? (
                          <CheckCircle />
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
                                  <button
                                    type="submit"
                                    className="text-white bg-black py-2 px-4 border rounded-lg"
                                  >
                                    {navigation.state == "submitting" &&
                                    navigation.formData.get("formType") == "getChosenRepo" ? (
                                      <p>Submitting....</p>
                                    ) : (
                                      <p>Submit</p>
                                    )}
                                  </button>
                                </Form>
                              </>
                            )}
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
                                      <input
                                        type="hidden"
                                        name="formType"
                                        value="getFilesOfChosenRepo"
                                      />
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
                                            {actionArgs.solFilesFromChosenRepo?.map(
                                              (fileName, i) => (
                                                <label key={i} className="text-xl">
                                                  <input
                                                    type="radio"
                                                    name="chosenFileName"
                                                    value={fileName}
                                                  />
                                                  {fileName}
                                                </label>
                                              )
                                            )}
                                          </fieldset>
                                          <br />
                                          <button
                                            type="submit"
                                            className="text-white bg-black py-2 px-4 border rounded-lg"
                                          >
                                            {navigation.state == "submitting" &&
                                            navigation.formData.get("formType") ==
                                              "chooseFileToTrack" ? (
                                              <p>Submitting....</p>
                                            ) : (
                                              <p>Submit</p>
                                            )}
                                          </button>
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
          ) : (
            <div id="content" className="w-3/4 max-w-7xl mx-auto py-20 rounded-lg">
              <div className="text-4xl flex gap-10 flex-row justify-between rounded-lg mt-10">
                <div className="w-2/5">
                  <div className="flex flex-col rounded-lg">
                    <div className="text-xl gap-2 bg-[#F5F5F5] p-5 flex flex-col rounded-lg">
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
                          <div className="absolute left-1/4 w-1/2 p-5 z-10 bg-white border border-black rounded-lg">
                            <div className="w-full justify-between flex flex-row">
                              <p className="text-2xl">Choose Repository:</p>
                              <Form method="post">
                                <input
                                  type="hidden"
                                  name="githubInstallationId"
                                  value={userData.githubInstallationId as string}
                                />
                                <input type="hidden" name="formType" value="clearActionArgs" />
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
                                className="text-white bg-black py-2 px-4 border rounded-lg"
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
                              <div className="absolute left-1/4 w-1/2 p-5 z-10 bg-white border border-black rounded-lg">
                                <div className="w-full justify-between flex flex-row">
                                  <p className="text-2xl">Choose File To Track:</p>
                                  <Form method="post">
                                    <input
                                      type="hidden"
                                      name="githubInstallationId"
                                      value={userData.githubInstallationId as string}
                                    />
                                    <input type="hidden" name="formType" value="clearActionArgs" />
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
                                        <input
                                          type="radio"
                                          name="chosenFileName"
                                          value={fileName}
                                        />{" "}
                                        {fileName}
                                      </label>
                                    ))}
                                  </fieldset>
                                  <br />
                                  <button
                                    type="submit"
                                    className="text-white bg-black py-2 px-4 border rounded-lg"
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
                            {userData?.Repository?.contractAddress?.slice(0, 8)}••••
                            {userData?.Repository?.contractAddress?.slice(37)} &nbsp;{" "}
                          </p>
                          <button>
                            <Edit
                              className="transform active:scale-75 transition-transform"
                              size={20}
                            />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-row justify-between rounded-lg">
                        <p className="text-2xl">Last Deployment: </p>
                        <p>{timeSince(userData?.Repository?.updatedAt)} ago</p>
                      </div>
                    </div>
                    <br />
                    <div className="flex flex-col bg-[#F5F5F5] p-5 rounded-lg">
                      <div className="flex flex-row justify-between">
                        <p>Functions: </p>
                        <div className="text-lg">
                          <ConnectKitButton.Custom>
                            {({
                              isConnected,
                              isConnecting,
                              show,
                              hide,
                              address,
                              ensName,
                              chain,
                            }) => {
                              return (
                                <button
                                  onClick={show}
                                  className="text-white bg-black py-2 px-4 border rounded-lg"
                                >
                                  {isConnected
                                    ? `${address?.slice(0, 7)}••••${address?.slice(37)}`
                                    : "Connect"}
                                </button>
                              );
                            }}
                          </ConnectKitButton.Custom>
                        </div>
                      </div>
                      <ul className="flex flex-col gap-2 pt-5 bg-[#F5F5F5] rounded-lg">
                        <p className="text-2xl border-b border-b-black">Read</p>
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
                                          let returnedData = await callContractFunction(
                                            method,
                                            userData?.Repository?.contractAbi as string,
                                            userData?.Repository?.contractAddress as `0x${string}`,
                                            getFunctionArgsFromInput(method),
                                            userData?.ApiKey?.key as string
                                          );
                                          setFunctionReturn(returnedData);
                                        }}
                                        className="text-white bg-black py-2 px-4 border rounded-lg"
                                      >
                                        Call
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
                        <p className="text-2xl border-b border-b-black">Write</p>

                        {JSON.parse(userData?.Repository?.contractAbi).map(
                          (method: AbiFunctionType, i: number) => (
                            <>
                              {!(
                                method.stateMutability == "view" || method.stateMutability == "pure"
                              ) && (
                                <li key={i} className="text-lg">
                                  <>
                                    <Accordion.Root
                                      type="multiple"
                                      className="w-full relative py-2"
                                    >
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
                                                if (isConnected || address) {
                                                  let returnedData = await callContractFunction(
                                                    method,
                                                    userData?.Repository?.contractAbi as string,
                                                    userData?.Repository
                                                      ?.contractAddress as `0x${string}`,
                                                    getFunctionArgsFromInput(method),
                                                    userData?.ApiKey?.key as string
                                                  );
                                                  setFunctionReturn(returnedData);
                                                }
                                              }}
                                              className="text-white bg-black py-2 px-4 border rounded-lg disabled:bg-[#cbcbcb]"
                                              disabled={!(isConnected || address)}
                                            >
                                              Call
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
                                                  if (isConnected || address) {
                                                    let returnedData = await callContractFunction(
                                                      method,
                                                      userData?.Repository?.contractAbi as string,
                                                      userData?.Repository
                                                        ?.contractAddress as `0x${string}`,
                                                      getFunctionArgsFromInput(method),
                                                      userData?.ApiKey?.key as string
                                                    );
                                                    setFunctionReturn(returnedData);
                                                  }
                                                }}
                                                className="text-white bg-black py-2 px-4 border rounded-lg disabled:bg-[#cbcbcb]"
                                                disabled={!(isConnected || address)}
                                              >
                                                Call
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
                            </>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex-1  bg-[#F5F5F5] p-5 rounded-lg ">
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
                        type="submit"
                        className="text-xl  text-white bg-black py-2 px-4 rounded-lg"
                      >
                        {deployStatus}
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
          )}
        </div>
      </ConnectKitProvider>
    </WagmiConfig>
  );
}
