import { Form, Link, useActionData, useNavigation, useSubmit } from "@remix-run/react";
import {
  CheckCircle,
  ChevronDown,
  ChevronsUpDown,
  Copy,
  Edit,
  Loader,
  PlusCircle,
  X,
} from "lucide-react";
import { DisplayCodesContext } from "~/routes/alpha";
import { action } from "~/routes/alpha.dashboard";
import {
  ContractReturn,
  TeamWithKeyRepoActivityMembers,
  UserWithKeyRepoActivityTeam,
} from "~/types";
import { useContext, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { isAddress } from "viem";
import { callContractFunction, getFunctionArgsFromInput, sleep, timeSince } from "~/utils/helpers";
import { CustomConnectButton } from "./ConnectButton";
import { AbiFunction as AbiFunctionType } from "abitype";
import React from "react";
import * as Accordion from "@radix-ui/react-accordion";
import TxViewer from "./TxViewer";

export interface DashboardProps {
  userData: UserWithKeyRepoActivityTeam;
  teamData: TeamWithKeyRepoActivityMembers;
  actionArgs: ReturnType<typeof useActionData<typeof action>>;
  navigation: ReturnType<typeof useNavigation>;
  dashboardType: "personal" | "team";
}

export const Dashboard = (props: DashboardProps) => {
  const userData = props.userData;
  const actionArgs = props.actionArgs;
  const navigation = props.navigation;
  const displayCodes = useContext(DisplayCodesContext);
  const submit = useSubmit();

  const { address, isConnected } = useAccount();
  const { data } = useBalance({ address });

  const [deployerModal, setDeployerModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [functionCalled, setFunctionCalled] = useState<string | null>(null);
  const [functionReturn, setFunctionReturn] = useState<ContractReturn | null>(null);
  const [addressValid, setAddressValid] = useState<boolean>(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [teamSelect, setTeamSelect] = useState(false);
  const [createTeam, setCreateTeam] = useState(false);

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

  const handleAddressChange = (event: any) => {
    let valid = isAddress(event.target.value);
    if (event.target.value == "") {
      setAddressValid(false);
      setAddressError(null);
      return;
    } else if (valid) {
      setAddressValid(true);
      setAddressError(null);
      return;
    } else {
      setAddressValid(false);
      setAddressError("Error: Invalid Address");
    }
  };
  return (
    <div className="selection:bg-accent selection:text-primary-gray max-w-screen h-auto min-h-screen display flex flex-col items-center justify-center text-[#a38282]">
      {userData &&
        userData.Repository &&
        userData.Repository.contractAddress &&
        userData.Repository.contractAbi &&
        userData.Repository.deployerAddress &&
        userData.Repository.filename &&
        userData.ApiKey &&
        userData.ApiKey.key && (
          <div id="content" className="w-3/4 max-w-7xl mx-auto rounded-lg mt-40 pb-40 text-white">
            {displayCodes.displayInviteCodes && (
              <div className="absolute top-0 left-0 z-50 flex items-center justify-center h-screen w-screen">
                <span className="bg-[#2f2f2f] opacity-70 absolute top-0 left-0 h-screen w-screen"></span>
                <div className="p-10 bg-[#727272] font-primary relative rounded-lg">
                  <button
                    onClick={() => displayCodes.setDisplayInviteCodes(false)}
                    className="absolute top-4 right-4"
                  >
                    <X />
                  </button>
                  <h1 className="text-5xl font-primary font-black">Invite friends!</h1>
                  <p className="mt-4">Have a friend you think might benefit from fether?</p>
                  <p className="mt-4">
                    Send them one of your invite codes below and they can try it out!
                  </p>
                  <div className="flex flex-row justify-evenly mt-4">
                    {userData?.IssuedInviteCodes?.map((code) => (
                      <div className="flex flex-col items-center">
                        <p
                          className={code.keyStatus == "UNUSED" ? "text-green-400" : "text-red-400"}
                        >
                          {code.keyStatus.slice(0, 1) + code.keyStatus.toLowerCase().slice(1)}
                        </p>

                        <div className="flex flex-row items-center">
                          <p>{code.inviteCode}</p>
                          {code.keyStatus == "UNUSED" && (
                            <button onClick={() => navigator.clipboard.writeText(code.inviteCode)}>
                              <Copy
                                className="transform ml-4 active:scale-75 transition-transform"
                                size={16}
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="text-4xl flex gap-10 flex-col xl:flex-row justify-between rounded-lg">
              <div className="w-full xl:w-2/5 ">
                <div className="flex flex-col rounded-lg gap-10">
                  <div className="text-xl gap-2 bg-secondary-gray border border-secondary-border shadow-md	 p-5 flex flex-col rounded-lg">
                    <p className="pb-2 text-4xl font-primary">Details :</p>
                    <div className="flex flex-row justify-between rounded-lg relative">
                      <p className="text-2xl font-primary text-tertiary-gray">
                        Current Dashboard :
                      </p>
                      <div className="flex flex-row items-center gap-2">
                        <p>{userData?.username}</p>

                        <button onClick={() => setTeamSelect(!teamSelect)}>
                          <ChevronsUpDown size={20} />
                        </button>
                      </div>
                      {teamSelect && (
                        <div className="absolute top-full p-4 w-full bg-tertiary-gray z-50 rounded-md">
                          <h1>Dashboard Selector</h1>
                          <div>
                            <p>Personal Account:</p>
                            <p>{userData?.username}</p>
                          </div>
                          {userData?.memberTeamId ? (
                            <div>
                              <p>Team:</p>
                              <Link to={`/alpha/team/${userData.MemberTeam?.id}`}>
                                {userData.MemberTeam?.name}
                              </Link>
                            </div>
                          ) : (
                            <div>
                              <div className="flex flex-row justify-between">
                                <p>Create Team</p>
                                <button onClick={() => setCreateTeam(!createTeam)}>
                                  {createTeam ? <X size={20} /> : <PlusCircle size={20} />}
                                </button>
                              </div>

                              {createTeam && (
                                <Form method="post" className="flex flex-col">
                                  <input
                                    type="hidden"
                                    name="githubInstallationId"
                                    value={userData.githubInstallationId as string}
                                  />
                                  <input type="hidden" name="formType" value="createTeam" />
                                  <input
                                    type="text"
                                    maxLength={20}
                                    name="teamName"
                                    placeholder="Team Name"
                                    className="text-black bg-transparent outline-none border-0 px-0 text-left focus:ring-0"
                                  />
                                  <button
                                    type="submit"
                                    className="flex items-center justify-center"
                                  >
                                    {navigation.state == "submitting" &&
                                    navigation.formData?.get("formType") == "createTeam" ? (
                                      <div className="animate-spin">
                                        <Loader size={20} />
                                      </div>
                                    ) : (
                                      "Create Team"
                                    )}
                                  </button>
                                </Form>
                              )}
                              {actionArgs?.originCallForm == "createTeam" && actionArgs.error && (
                                <p className="text-red-500 text-base">{actionArgs.error}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-row justify-between rounded-lg">
                      <p className="text-2xl font-primary text-tertiary-gray">Api Key :</p>
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
                      <p className="text-2xl font-primary text-tertiary-gray">Repository :</p>
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
                            navigation.formData?.get("formType") == "getAllRepos" ? (
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
                        <div className="absolute top-0 left-0 z-50 flex items-center justify-center h-screen w-screen">
                          <div className="absolutew-1/2 p-5 bg-secondary-gray border border-white rounded-lg">
                            <div className="w-full justify-between flex flex-row">
                              <p className="text-2xl">Choose Repository :</p>
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

                              <button type="submit" className=" bg-accent py-2 px-4  rounded-lg">
                                {navigation.state == "submitting" &&
                                navigation.formData?.get("formType") == "getChosenRepo" ? (
                                  <p>Submitting....</p>
                                ) : (
                                  <p>Submit</p>
                                )}
                              </button>
                            </Form>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-row justify-between rounded-lg">
                      <p className="text-2xl font-primary text-tertiary-gray">Contract :</p>
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
                              navigation.formData?.get("formType") == "getFilesOfChosenRepo" ? (
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
                            <div className="absolute top-0 left-0 z-50 flex items-center justify-center h-screen w-screen">
                              <div className="p-5 bg-secondary-gray border border-white rounded-lg">
                                <div className="justify-between flex flex-row">
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
                                    className=" bg-accent py-2 px-4  rounded-lg"
                                  >
                                    {navigation.state == "submitting" &&
                                    navigation.formData?.get("formType") == "chooseFileToTrack" ? (
                                      <p>Submitting....</p>
                                    ) : (
                                      <p>Submit</p>
                                    )}
                                  </button>
                                </Form>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row justify-between rounded-lg">
                      <p className="text-2xl font-primary text-tertiary-gray">Deployer :</p>
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
                          <div className="absolute top-0 left-0 z-50 flex items-center justify-center h-screen w-screen">
                            <div className="absolute left-1/4 w-1/2 p-5 pb-10 bg-secondary-gray border border-white rounded-lg">
                              <div className="w-full justify-between flex flex-row">
                                <p className="text-2xl">Update Deployer Address:</p>
                                <button
                                  onClick={() => setDeployerModal(false)}
                                  className="float-right"
                                >
                                  <X />
                                </button>
                              </div>

                              <Form method="post" className="w-11/12 mt-5 h-full">
                                <input
                                  type="hidden"
                                  name="githubInstallationId"
                                  value={userData?.githubInstallationId?.toString()}
                                />
                                <input type="hidden" name="formType" value="setDeployerAddress" />

                                <div className="flex  overflow-hidden bg-white rounded-lg flex-row items-center justify-between w-full h-full">
                                  <input
                                    className="text-lg outline-none border-none text-black px-2 w-5/6  bg-[#D9D9D9]"
                                    name="deployerAddress"
                                    placeholder="Input desired contract deployer address"
                                    onChange={handleAddressChange}
                                  />
                                  <button
                                    className="text-white h-full flex-1 text-xl disabled:bg-tertiary-gray bg-accent py-2 px-4"
                                    type="submit"
                                    disabled={!addressValid}
                                  >
                                    {navigation.state == "submitting" &&
                                    navigation.formData &&
                                    navigation.formData.get("formType") == "setDeployerAddress" ? (
                                      <div className="inline-block animate-spin">
                                        <Loader size={20} />
                                      </div>
                                    ) : (
                                      <p>Confirm</p>
                                    )}
                                  </button>
                                </div>
                              </Form>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-row justify-between rounded-lg">
                      <p className="text-2xl font-primary text-tertiary-gray">Last Deployment :</p>
                      <p>
                        {userData?.Repository?.lastDeployed
                          ? `${timeSince(userData?.Repository?.lastDeployed)} ago`
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col bg-secondary-gray  border border-secondary-border  shadow-md	 p-5 rounded-lg">
                    <div className="flex flex-row justify-between">
                      <p className="font-primary">Functions :</p>
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
                            navigation.formData?.get("formType") == "fundWallet" ? (
                              <div className="text-[#f0f0f0] bg-almost-black py-2 mt-2 px-4 text-xl rounded-lg flex flex-row items-center float-right">
                                +1 FEth
                                <div className="animate-spin items-center ml-3">
                                  <Loader size={20} />
                                </div>
                              </div>
                            ) : (
                              <button
                                type="submit"
                                className="text-[#f0f0f0] bg-almost-black py-2 px-4 rounded-lg mt-2 text-xl float-right"
                              >
                                Add FEth
                              </button>
                            )}
                          </Form>
                        </div>
                      </div>
                    )}

                    <ul className="flex flex-col gap-2 rounded-lg">
                      <p className="text-2xl pb-1 border-b border-b-[#363636] font-primary">Read</p>
                      <div className="py-2">
                        {JSON.parse(userData?.Repository?.contractAbi as string).map(
                          (method: AbiFunctionType, i: number) => (
                            <div key={i}>
                              {(method.stateMutability == "view" ||
                                method.stateMutability == "pure") &&
                                method.type == "function" && (
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
                                        className="text-[#f0f0f0] bg-almost-black py-2 px-4 rounded-lg"
                                      >
                                        {functionCalled == method.name ? (
                                          <div className="flex flex-row items-center">
                                            <p>Calling </p>
                                            <div className="ml-2 animate-spin">
                                              <Loader size={20} />
                                            </div>
                                          </div>
                                        ) : (
                                          <>Call</>
                                        )}
                                      </button>
                                    </div>
                                    {functionReturn?.methodName == method.name &&
                                      method.outputs.length > 0 && (
                                        <div className="flex flex-col break-words">
                                          <p>Returned:</p>
                                          {method.outputs.map((output, index) => (
                                            <div
                                              key={index}
                                              className="bg-transparent 100% rounded-lg flex flex-row"
                                            >
                                              <p className="text-tertiary-gray">
                                                {functionReturn.returnItems[index].name}:{" "}
                                              </p>
                                              {functionReturn.returnItems[index].value.length <
                                              20 ? (
                                                <p className="ml-4 break-[anywhere]">
                                                  {functionReturn.returnItems[index].value}
                                                </p>
                                              ) : (
                                                <div className="flex items-center justify-between">
                                                  <p className="ml-4">
                                                    {functionReturn.returnItems[index].value.slice(
                                                      0,
                                                      8
                                                    )}
                                                    ••••
                                                    {functionReturn.returnItems[index].value.slice(
                                                      37
                                                    )}
                                                  </p>
                                                  <Copy
                                                    className="transform ml-4 active:scale-75 transition-transform"
                                                    size={20}
                                                    onClick={() =>
                                                      navigator.clipboard.writeText(
                                                        functionReturn.returnItems[index].value
                                                      )
                                                    }
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                  </li>
                                )}
                            </div>
                          )
                        )}
                      </div>
                      <p className="text-2xl border-b border-b-[#363636] pb-1 font-primary">
                        Write
                      </p>

                      {JSON.parse(userData?.Repository?.contractAbi).map(
                        (method: AbiFunctionType, i: number) => (
                          <React.Fragment key={i}>
                            {!(
                              method.stateMutability == "view" || method.stateMutability == "pure"
                            ) &&
                              method.type == "function" && (
                                <li className="text-lg">
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
                                              className="text-[#f0f0f0] bg-almost-black py-2 px-4 rounded-lg disabled:bg-[#cbcbcb]"
                                              disabled={!Boolean(address)}
                                            >
                                              {functionCalled == method.name ? (
                                                <div className="flex flex-row items-center">
                                                  <p>Calling </p>
                                                  <div className="ml-2 animate-spin">
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
                                                ))}
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
                                                className="text-[#f0f0f0] bg-almost-black py-2 px-4  rounded-lg disabled:bg-[#cbcbcb]"
                                                disabled={!Boolean(address)}
                                              >
                                                {functionCalled == method.name ? (
                                                  <div className="flex flex-row items-center">
                                                    <p>Calling </p>
                                                    <div className="ml-2 animate-spin">
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
                                  {functionReturn?.methodName == method.name &&
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
                          </React.Fragment>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="flex flex-col w-full xl:w-3/5 gap-10">
                <div className="flex-1  bg-secondary-gray border border-secondary-border  shadow-md	 p-5 rounded-lg ">
                  <div className="flex flex-row justify-between align-middle items-center">
                    <p className="font-primary">Transactions :</p>

                    <Form method="post" className="flex items-center">
                      <input
                        type="hidden"
                        name="githubInstallationId"
                        value={userData.githubInstallationId?.toString() as string}
                      />
                      <input type="hidden" name="formType" value="deployContract" />

                      <button
                        className="text-xl text-[#f0f0f0] bg-almost-black py-2 px-4 rounded-lg"
                        type="submit"
                      >
                        {navigation.state == "submitting" &&
                        navigation.formData?.get("formType") == "deployContract" ? (
                          <div className="flex flex-row items-center">
                            <p>Deploying</p>{" "}
                            <div className="animate-spin ml-2">
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
                      <tr className="text-left text-tertiary-gray font-primary">
                        <th className="text-lg">Tx Hash</th>
                        <th className="text-lg">Function Name</th>
                        <th className="text-lg">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userData?.Repository?.Activity?.map((transaction: any, i) => (
                        <tr key={i} className="">
                          <td>
                            <Form method="post">
                              <input
                                type="hidden"
                                name="githubInstallationId"
                                value={userData.githubInstallationId?.toString() as string}
                              />
                              <input type="hidden" name="formType" value="getTransaction" />
                              <input type="hidden" name="apiKey" value={userData.ApiKey?.key} />
                              <input type="hidden" name="txHash" value={transaction.txHash} />
                              <button
                                // href={`http://localhost:3003/${transaction.txHash}`}
                                // target="_blank"

                                className="text-lg block underline"
                                type="submit"
                              >
                                {transaction.txHash.slice(0, 12)}...
                              </button>
                            </Form>
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
                  {actionArgs?.originCallForm == "getTransaction" && actionArgs.txDetails && (
                    <TxViewer
                      txDetails={actionArgs.txDetails}
                      githubInstallationId={userData.githubInstallationId as string}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
