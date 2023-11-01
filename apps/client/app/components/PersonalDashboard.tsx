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
import { AbiFunction as AbiFunctionType, AbiParameter } from "abitype";
import { Abi } from "abitype/zod";

import React from "react";
import * as Accordion from "@radix-ui/react-accordion";
import TxViewer from "./TxViewer";
import { InviteFriendsModal } from "./InviteFriendsModal";
import { DashboardSelector } from "./DashboardSelector";
import { PopupModal } from "./PopupModal";

export interface DashboardProps {
  userData: UserWithKeyRepoActivityTeam;
  teamData: TeamWithKeyRepoActivityMembers;
  actionArgs: ReturnType<typeof useActionData<typeof action>>;
  navigation: ReturnType<typeof useNavigation>;
  dashboardType: "personal" | "team";
}

export const PersonalDashboard = (props: DashboardProps) => {
  const userData = props.userData;
  const parsedAbi = Abi.parse(JSON.parse(userData?.Repository?.contractAbi as string));
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
  const [openDeployContractModal, setOpenDeployContractModal] = useState(false);
  const [constructorArgModal, setConstructorArgModal] = useState(false);

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
    <div className="flex flex-col font-primary min-h-screen">
      <div
        id="dashboard-top-bar"
        className="mt-20 px-20 border-b border-b-off-white/25 text-white w-full bg-[#27262B] h-32 flex flex-row items-center justify-between relative"
      >
        <div className="flex flex-col justify-between rounded-lg">
          <p className="text-sm text-tertiary-gray">Current Dashboard :</p>
          <div className="flex flex-row align-middle gap-1">
            <p className="text-3xl">{userData?.username}</p>

            <button onClick={() => setTeamSelect(!teamSelect)}>
              <ChevronsUpDown size={20} color="rgb(156 163 175)" />
            </button>
          </div>
          {teamSelect && (
            <DashboardSelector
              userData={userData}
              navigation={navigation}
              actionArgs={actionArgs}
            />
          )}
        </div>
        <div className="flex flex-col ml-16">
          <p className="text-sm   text-tertiary-gray">Api Key :</p>
          <div className="flex flex-row items-center gap-2">
            <p className="text-3xl">
              {userData?.ApiKey?.key.slice(0, 5)}••••
              {userData?.ApiKey?.key.slice(20)}
            </p>
            <button className="transform active:scale-75 transition-transform">
              {copied ? (
                <CheckCircle size={20} color="rgb(156 163 175)" />
              ) : (
                <Copy
                  size={20}
                  color="rgb(156 163 175)"
                  onClick={() => {
                    animateCopy();
                  }}
                />
              )}
            </button>
          </div>
        </div>
        <div className="w-1/2 flex justify-end items-end">
          <div>
            <p className="text-sm text-tertiary-gray">Wallet :</p>
            <CustomConnectButton />
          </div>
          {!isConnected ? (
            <button
              type="submit"
              disabled={true}
              className="bg-almost-black/25 text-off-white/25 border border-off-white/25 ml-6 py-2 px-8 rounded-full mt-2 text-base float-right"
            >
              Add FEth
            </button>
          ) : (
            <Form method="post">
              <input
                type="hidden"
                name="githubInstallationId"
                value={userData?.githubInstallationId as string}
              />
              <input type="hidden" name="formType" value="fundWallet" />
              <input type="hidden" name="walletAddress" value={address} />
              <input type="hidden" name="currentBalance" value={data?.formatted} />

              {navigation.state == "submitting" &&
              navigation.formData?.get("formType") == "fundWallet" ? (
                <div className="flex flex-row bg-primary-gray text-off-white border border-off-white ml-6 py-2 px-4 rounded-full mt-2 text-base float-right">
                  +1 FEth
                  <div className="animate-spin flex justify-center items-center ml-3">
                    <Loader size={20} />
                  </div>
                </div>
              ) : (
                <button
                  type="submit"
                  className=" bg-primary-gray text-off-white border border-off-white ml-6 py-2 px-8 rounded-full mt-2 text-base float-right"
                >
                  Add FEth
                </button>
              )}
            </Form>
          )}
        </div>
      </div>
      {userData &&
        userData.Repository &&
        userData.Repository.contractAddress &&
        userData.Repository.contractAbi &&
        userData.Repository.deployerAddress &&
        userData.Repository.filename &&
        userData.ApiKey &&
        userData.ApiKey.key && (
          <div className="flex-1 flex flex-col text-white">
            {displayCodes.displayInviteCodes && (
              <InviteFriendsModal userData={userData} displayCodes={displayCodes} />
            )}
            <div className="w-full text-4xl h-full flex-1 flex flex-col xl:flex-row">
              <div className="w-full xl:w-[40.5%] min-h-full pb-5 bg-dark-gray border-r border-r-off-white/25">
                <div className="text-xl gap-3 border-b border-b-off-white/25 shadow-md p-5 flex flex-col">
                  <p className="pb-2 text-4xl font-bold  ">Contract</p>
                  <div className="flex flex-row justify-between rounded-lg">
                    <p className="text-2xl   text-tertiary-gray">Address</p>
                    <div className="flex flex-row items-center">
                      <p>
                        {userData?.Repository?.contractAddress?.slice(0, 8)}••••
                        {userData?.Repository?.contractAddress?.slice(37)}
                      </p>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            userData?.Repository?.contractAddress as string
                          )
                        }
                      >
                        <Copy
                          className="transform ml-4 active:scale-75 transition-transform"
                          size={20}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-row justify-between rounded-lg">
                    <p className="text-2xl   text-tertiary-gray">ABI</p>
                    <div className="flex flex-row items-center">
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(userData?.Repository?.contractAbi as string)
                        }
                      >
                        <button className="text-base rounded-full px-4 py-1 text-secondary-orange border border-off-white/50 transform ml-4 active:scale-75 transition-transform">
                          Copy ABI
                        </button>
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-row justify-between rounded-lg">
                    <p className="text-2xl   text-tertiary-gray">Deployer</p>
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
                      <PopupModal
                        display={
                          deployerModal && actionArgs?.originCallForm != "setDeployerAddress"
                        }
                        displaySetter={setDeployerModal}
                      >
                        <p className="text-2xl">Update Deployer Address:</p>
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
                              className="text-white h-full flex-1 text-xl disabled:bg-tertiary-gray bg-secondary-orange py-2 px-4"
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
                      </PopupModal>
                    </div>
                  </div>
                  {userData?.Repository?.cachedConstructorArgs &&
                    JSON.parse(userData?.Repository?.cachedConstructorArgs).length > 0 && (
                      <>
                        <div className="flex flex-row justify-between rounded-lg">
                          <p className="text-2xl   text-tertiary-gray">Constructor Args</p>
                          <button
                            className="text-base rounded-full px-4 py-1 text-secondary-orange border border-off-white/50 transform ml-4 active:scale-75 transition-transform"
                            key="openUpdateConstructorArgModalButton"
                            onClick={() => {
                              setConstructorArgModal(true);
                            }}
                          >
                            Edit Args
                          </button>
                        </div>
                        <PopupModal
                          display={constructorArgModal}
                          displaySetter={setConstructorArgModal}
                        >
                          <Form
                            method="post"
                            key="updateConstructorArgsForm"
                            className="mt-5 pb-10"
                          >
                            <input
                              type="hidden"
                              name="githubInstallationId"
                              value={userData?.githubInstallationId?.toString()}
                            />
                            <input
                              key="updateConstructorArgsFormType"
                              type="hidden"
                              name="formType"
                              value="updateConstructorArgs"
                            />
                            <h1>Input new constructor args into the corresponding field.</h1>
                            <div className="grid grid-cols-2 mt-6">
                              {parsedAbi.map(
                                (method, i) =>
                                  method.type == "constructor" &&
                                  method.inputs.length > 0 &&
                                  method.inputs.map((input, i) => (
                                    <div className="flex flex-col justify-center items-center text-center">
                                      <p className="text-sm text-off-white/50">
                                        {input.type + " " + input.name}
                                      </p>
                                      <input
                                        key={"constructorArg-" + i}
                                        type="text"
                                        name={"constructorArg-" + i}
                                        placeholder={
                                          "Current: " +
                                          JSON.parse(
                                            userData?.Repository?.cachedConstructorArgs as string
                                          )[i]
                                        }
                                        className="bg-transparent mt-1 text-center focus:border-off-white  focus:ring-0"
                                      />
                                    </div>
                                  ))
                              )}
                            </div>
                            <input
                              key="numOfArgsFromInputNewConstructorArgs"
                              type="hidden"
                              name="numOfArgs"
                              value={
                                parsedAbi[0].type == "constructor" && parsedAbi[0].inputs.length > 0
                                  ? parsedAbi[0].inputs.length
                                  : 0
                              }
                            />
                            <div className="flex w-full justify-center mt-10">
                              <button
                                type="submit"
                                className=" bg-secondary-orange py-3 px-20 rounded-full"
                              >
                                {navigation.state == "submitting" &&
                                navigation.formData?.get("formType") == "updateConstructorArgs" ? (
                                  <p>Updating</p>
                                ) : (
                                  <p>Update</p>
                                )}
                              </button>
                            </div>
                          </Form>
                        </PopupModal>
                      </>
                    )}
                  <div className="flex flex-row justify-between rounded-lg">
                    <p className="text-2xl   text-tertiary-gray">Last Deployment</p>
                    <p>
                      {userData?.Repository?.lastDeployed
                        ? `${timeSince(userData?.Repository?.lastDeployed)} ago`
                        : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="text-xl gap-3 border-b border-b-off-white/25 shadow-md p-5 flex flex-col">
                  <p className="pb-2 text-4xl font-bold  ">Repository</p>
                  <div className="flex flex-row justify-between rounded-lg">
                    <p className="text-2xl   text-tertiary-gray">Name</p>
                    <div className="flex flex-row items-center">
                      <p>{userData.Repository.repoName} &nbsp;</p>{" "}
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
                    <PopupModal
                      display={actionArgs?.originCallForm == "getRepos"}
                      displaySetter={() =>
                        submit(null, { method: "post", action: "/alpha/dashboard" })
                      }
                    >
                      <p className="text-2xl mt-3">Choose Repository :</p>
                      <Form method="post" className="mt-5 pb-4">
                        <input
                          type="hidden"
                          name="githubInstallationId"
                          value={userData.githubInstallationId as string}
                        />
                        <input type="hidden" name="formType" value="getChosenRepo" />

                        <fieldset className="grid grid-cols-2 gap-2">
                          {actionArgs?.repositories?.map((repo) => (
                            <label key={repo.repoName} className="text-base">
                              <input
                                type="radio"
                                name="chosenRepoData"
                                value={[repo.repoName, repo.repoId]}
                                className="text-secondary-orange checked:outline-secondary-orange"
                              />{" "}
                              {repo.repoName}
                            </label>
                          ))}
                        </fieldset>
                        <br />
                        <div className="flex w-full justify-center mt-4">
                          <button
                            type="submit"
                            className=" bg-secondary-orange py-3 px-20 rounded-full"
                          >
                            {navigation.state == "submitting" &&
                            navigation.formData?.get("formType") == "getChosenRepo" ? (
                              <p>Updating</p>
                            ) : (
                              <p>Update</p>
                            )}
                          </button>
                        </div>
                      </Form>
                    </PopupModal>
                  </div>
                  <div className="flex flex-row justify-between rounded-lg">
                    <p className="text-2xl   text-tertiary-gray">Branch</p>
                    <div className="flex flex-row items-center">
                      <p>{userData.Repository.branchName} &nbsp;</p>{" "}
                      <div>
                        <Form method="post">
                          <input
                            type="hidden"
                            name="githubInstallationId"
                            value={userData.githubInstallationId as string}
                          />
                          <input type="hidden" name="formType" value="getBranchesOfChosenRepo" />
                          <button type="submit">
                            {navigation.state == "submitting" &&
                            navigation.formData?.get("formType") == "getBranchesOfChosenRepo" ? (
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
                        <PopupModal
                          display={actionArgs?.originCallForm == "getBranchesOfChosenRepo"}
                          displaySetter={() =>
                            submit(null, { method: "post", action: "/alpha/dashboard" })
                          }
                        >
                          <Form method="post" className="mt-5 pb-5">
                            <input
                              type="hidden"
                              name="githubInstallationId"
                              value={userData.githubInstallationId as string}
                            />
                            <input type="hidden" name="formType" value="chooseBranch" />
                            <fieldset className="grid grid-cols-2 gap-[2px] bg-white">
                              {actionArgs?.branches?.map((branchName, i) => (
                                <div key={i} className="p-4 text-base bg-dark-gray">
                                  <input
                                    key={i}
                                    className="text-secondary-orange checked:outline-secondary-orange"
                                    type="radio"
                                    name="choosenBranch"
                                    value={branchName}
                                  />{" "}
                                  {branchName}
                                </div>
                              ))}
                            </fieldset>
                            <br />
                            <div className="flex w-full justify-center mt-4">
                              <button
                                type="submit"
                                className=" bg-secondary-orange py-3 px-20 rounded-full"
                              >
                                {navigation.state == "submitting" &&
                                navigation.formData?.get("formType") == "chooseBranch" ? (
                                  <p>Updating</p>
                                ) : (
                                  <p>Track Branch</p>
                                )}
                              </button>
                            </div>
                          </Form>
                        </PopupModal>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row justify-between rounded-lg">
                    <p className="text-2xl   text-tertiary-gray">Contract</p>
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
                        <PopupModal
                          display={actionArgs?.originCallForm == "getFilesOfChosenRepo"}
                          displaySetter={() =>
                            submit(null, { method: "post", action: "/alpha/dashboard" })
                          }
                        >
                          <div className="justify-between flex flex-row"></div>
                          <Form method="post" className="mt-5 pb-5">
                            <input
                              type="hidden"
                              name="githubInstallationId"
                              value={userData.githubInstallationId as string}
                            />
                            <input type="hidden" name="formType" value="chooseFileToTrack" />
                            <fieldset className="grid grid-cols-2 gap-[2px] bg-white">
                              {actionArgs?.solFilesFromChosenRepo?.map((fileName, i) => (
                                <div key={i} className="p-4 text-base bg-dark-gray">
                                  <input
                                    type="radio"
                                    name="chosenFileName"
                                    className="text-secondary-orange checked:outline-secondary-orange"
                                    value={fileName}
                                  />{" "}
                                  {fileName}
                                </div>
                              ))}
                            </fieldset>
                            <br />
                            <div className="flex w-full justify-center mt-4">
                              <button
                                type="submit"
                                className=" bg-secondary-orange py-3 px-20 rounded-full"
                              >
                                {navigation.state == "submitting" &&
                                navigation.formData?.get("formType") == "chooseBranch" ? (
                                  <p>Updating</p>
                                ) : (
                                  <p>Track File</p>
                                )}
                              </button>
                            </div>
                          </Form>
                        </PopupModal>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex p-5 flex-col">
                  <div className="flex flex-row justify-between">
                    <p className="  font-bold">Functions</p>
                  </div>
                  <ul className="flex flex-col gap-2">
                    <p className="text-xl   mt-4 text-tertiary-gray">Read</p>
                    <div className="ml-4">
                      {parsedAbi.map((method, i: number) => (
                        <div key={i}>
                          {method.type == "function" &&
                            (method.stateMutability == "view" ||
                              method.stateMutability == "pure") &&
                            method.type == "function" && (
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
                                            }}
                                            className="border border-off-white/25  bg-almost-black py-2 px-6 rounded-full disabled:bg-[#cbcbcb]"
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
                                              {method.inputs.map((input, i) =>
                                                input.type == "tuple" ? (
                                                  <React.Fragment key={i}>
                                                    {input.internalType}
                                                    {
                                                      //@ts-ignore
                                                      input.components.map(
                                                        (component: AbiParameter) => (
                                                          <input
                                                            key={component.name}
                                                            id={`${method.name}-${input.name}-${component.name}`}
                                                            className="bg-transparent rounded-lg ml-12"
                                                            type="text"
                                                            placeholder={`${component.type}: ${component.name}`}
                                                          />
                                                        )
                                                      )
                                                    }
                                                  </React.Fragment>
                                                ) : (
                                                  <input
                                                    key={input.name}
                                                    id={`${method.name}-${input.name}`}
                                                    className="bg-transparent rounded-lg"
                                                    type="text"
                                                    placeholder={`${input.type}: ${input.name}`}
                                                  />
                                                )
                                              )}
                                            </div>
                                            <button
                                              onClick={async () => {
                                                setFunctionCalled(method.name);
                                                console.log(method);
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
                                              }}
                                              className="border border-off-white/25 bg-almost-black py-2 px-6  rounded-full disabled:bg-[#cbcbcb]"
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
                        </div>
                      ))}
                    </div>
                    <p className="text-xl   mt-4 text-tertiary-gray">Write</p>
                    <div className="ml-4 flex flex-col gap-2">
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
                                            <div className="absolute right-0 top-0  transition-transform group-data-[state=open]:rotate-180">
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
                                              className="border border-off-white/25  bg-almost-black py-2 px-6 rounded-full disabled:bg-[#cbcbcb]"
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
                                                {method.inputs.map((input, i) =>
                                                  input.type == "tuple" ? (
                                                    <React.Fragment key={i}>
                                                      {input.internalType}
                                                      {
                                                        //@ts-ignore
                                                        input.components.map(
                                                          (component: AbiParameter) => (
                                                            <input
                                                              key={component.name}
                                                              id={`${method.name}-${input.name}-${component.name}`}
                                                              className="bg-transparent rounded-lg ml-12"
                                                              type="text"
                                                              placeholder={`${component.type}: ${component.name}`}
                                                            />
                                                          )
                                                        )
                                                      }
                                                    </React.Fragment>
                                                  ) : (
                                                    <input
                                                      key={input.name}
                                                      id={`${method.name}-${input.name}`}
                                                      className="bg-transparent rounded-lg"
                                                      type="text"
                                                      placeholder={`${input.type}: ${input.name}`}
                                                    />
                                                  )
                                                )}
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
                                                className="border border-off-white/25  bg-almost-black py-2 px-6  rounded-full disabled:bg-[#cbcbcb]"
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
                    </div>
                  </ul>
                </div>
              </div>
              <div className="flex flex-col w-full xl:flex-1 gap-10 py-12 pl-12 pr-16">
                <div className="min-h-[50%] bg-secondary-gray border border-off-white/25  shadow-md	p-5 rounded-lg ">
                  <div className="flex flex-row justify-between align-middle items-center">
                    <p className=" ">Transactions</p>
                    <Form method="post" className="flex items-center">
                      <input
                        type="hidden"
                        name="githubInstallationId"
                        value={userData.githubInstallationId?.toString() as string}
                      />
                      <input type="hidden" name="formType" value="deployContract" />
                      {parsedAbi[0].type == "constructor" && parsedAbi[0].inputs.length > 0 ? (
                        <>
                          {!openDeployContractModal && (
                            <button
                              key={"openContractDeployerModalButton"}
                              type="button"
                              className="text-base border border-off-white/50 text-[#f0f0f0] bg-almost-black py-2 px-4 rounded-full"
                              onClick={() => setOpenDeployContractModal(true)}
                            >
                              {deployStatus}
                            </button>
                          )}
                          <PopupModal
                            display={openDeployContractModal}
                            displaySetter={setOpenDeployContractModal}
                          >
                            <div className="pb-10 mt-5">
                              <h1 className="text-lg">
                                Input constructor args to {deployStatus.toLowerCase()} your
                                contract!
                              </h1>

                              <input
                                className="focus:outline-none rounded-xl focus:border-none ring-0 focus:ring-0"
                                type="checkbox"
                                name="useCachedArgs"
                                id="useCachedArgs"
                              />
                              <label
                                className="ml-2 text-base align-middle"
                                htmlFor="useCachedArgs"
                              >
                                Use cached constructor args?
                              </label>
                              <div className="grid grid-cols-2 gap-2 mt-6">
                                {parsedAbi.map(
                                  (method, i) =>
                                    method.type == "constructor" &&
                                    method.inputs.length > 0 &&
                                    method.inputs.map((input, i) => (
                                      <div className="flex flex-col justify-center items-center text-center">
                                        <p className="text-sm text-off-white/50">
                                          {input.type + " " + input.name}
                                        </p>
                                        <input
                                          key={"constructorArg-" + i}
                                          type="text"
                                          name={"constructorArg-" + i}
                                          placeholder={
                                            "Current: " +
                                            JSON.parse(
                                              userData?.Repository?.cachedConstructorArgs as string
                                            )[i]
                                          }
                                          className="bg-transparent mt-1 text-center focus:border-off-white  focus:ring-0"
                                        />
                                      </div>
                                    ))
                                )}
                              </div>
                              <input
                                type="hidden"
                                name="numOfArgs"
                                value={
                                  parsedAbi[0].type == "constructor" &&
                                  parsedAbi[0].inputs.length > 0
                                    ? parsedAbi[0].inputs.length
                                    : 0
                                }
                              />
                              <div className="flex w-full justify-center mt-10">
                                <button
                                  type="submit"
                                  className=" bg-secondary-orange text-xl py-3 px-20 rounded-full"
                                >
                                  {navigation.state == "submitting" &&
                                  navigation.formData?.get("formType") == "deployContract" ? (
                                    <p>Deploying</p>
                                  ) : (
                                    <p>{deployStatus}</p>
                                  )}
                                </button>
                              </div>
                            </div>
                          </PopupModal>
                        </>
                      ) : (
                        <button
                          key={"deployContractSubmitButton"}
                          className="text-base text-[#f0f0f0] border border-off-white/50  bg-almost-black py-2 px-4 rounded-full"
                          type="submit"
                        >
                          {navigation.state == "submitting" &&
                          navigation.formData?.get("formType") == "deployContract" ? (
                            <div className="flex flex-row items-center">
                              <p>Deploying</p>
                              <div className="animate-spin ml-2">
                                <Loader size={20} />
                              </div>
                            </div>
                          ) : (
                            <p>{deployStatus}</p>
                          )}
                        </button>
                      )}
                    </Form>
                  </div>
                  <table className="table-fixed w-full mt-5">
                    <thead>
                      <tr className="text-left text-tertiary-gray  ">
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
                              <button className="text-lg block underline" type="submit">
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
