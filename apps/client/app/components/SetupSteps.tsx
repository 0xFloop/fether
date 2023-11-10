import { Form, useActionData, useNavigation, useSubmit } from "@remix-run/react";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { TeamWithKeyRepoActivityMembers, UserWithKeyRepoActivityTeam } from "~/types";
import { action } from "~/routes/alpha.dashboard";
import { isAddress } from "viem";
import { Abi } from "abitype/zod";

type setupStep = {
  stepNumber: string;
  name: string;
  description: JSX.Element;
  iconUrl: string;
  actionComponent: (props: setupProps) => JSX.Element;
};

type setupProps = {
  userData: UserWithKeyRepoActivityTeam;
  teamData: TeamWithKeyRepoActivityMembers;
  dashboardType: "personal" | "team";
  navigation: ReturnType<typeof useNavigation>;
  actionArgs: ReturnType<typeof useActionData<typeof action>>;
  updateStep: (step: number) => void;
};

const GenerateKeyComponent: React.FC<setupProps> = (props: setupProps) => {
  const data = props.dashboardType == "personal" ? props.userData : props.teamData;
  return (
    <Form method="post" action="/api/keygen">
      <input type="hidden" name="id" value={data?.id} />
      <input type="hidden" name="formType" value="generateApiKey" />
      <input type="hidden" name="dashboardType" value={props.dashboardType} />

      <button
        disabled={props.navigation.state === "submitting"}
        type="submit"
        className="py-2 pl-4 pr-2 bg-secondary-orange rounded-full flex flex-row items-center gap-10 border-off-white/50"
      >
        {props.navigation.state == "submitting" ? (
          <div className="flex flex-row items-center">
            <p>Generating</p>
            <div className="ml-1 animate-spin">
              <Loader size={20} />
            </div>
          </div>
        ) : (
          "Generate Key"
        )}
        <img src="/images/fetherLogoWhite.svg" alt="" />
      </button>
    </Form>
  );
};

const InstallGithubAppComponent: React.FC<setupProps> = (props: setupProps) => {
  if (props.teamData) return;
  else {
    return (
      <Form method="post" action="/api/gh-app-install">
        <input type="hidden" name="username" value={props.userData?.username} />
        <button
          disabled={props.navigation.state === "submitting"}
          type="submit"
          className="py-2 pl-4 pr-2 bg-secondary-orange rounded-full flex flex-row items-center gap-10 border-off-white/50"
        >
          <p>Install Github App</p>
          <img src="/images/fetherLogoWhite.svg" alt="" />
        </button>
      </Form>
    );
  }
};

const SelectRepoComponent: React.FC<setupProps> = (props: setupProps) => {
  const data = props.dashboardType == "personal" ? props.userData : props.teamData;
  const [repoChosen, setRepoChosen] = useState(false);
  let submit = useSubmit();
  useEffect(() => {
    submit(
      {
        githubInstallationId: props.userData?.githubInstallationId as string,
        formType: "getAllRepos",
      },
      {
        method: "post",
        encType: "application/x-www-form-urlencoded",
      }
    );
  }, []);
  return (
    <div className="h-full w-full flex flex-col gap-4">
      {props.actionArgs?.originCallForm != "getRepos" ? (
        <div className="">
          {props.navigation.state == "submitting" &&
            props.navigation.formData &&
            props.navigation.formData.get("formType") == "getAllRepos" && (
              <div className="flex flex-row items-center">
                Loading repositories
                <div className="ml-1 animate-spin">
                  <Loader size={20} />
                </div>
              </div>
            )}
        </div>
      ) : (
        <>
          {data?.Repository?.repoName && (
            <>
              <p>Current Repo: {data?.Repository?.repoName}</p>
              <button
                onClick={() => props.updateStep(3)}
                className="py-2 text-lg px-6 bg-secondary-orange border rounded-full border-off-white/50 absolute bottom-6 right-6"
              >
                <p>Next</p>
              </button>
            </>
          )}
          <Form className="overflow-y-auto mb-4 border border-off-white/50" method="post">
            <input
              type="hidden"
              name="githubInstallationId"
              value={props.userData?.githubInstallationId?.toString()}
            />
            <input type="hidden" name="formType" value="getChosenRepo" />

            <fieldset
              id="repoSelector"
              className="grid grid-cols-2 [&>*:nth-child(odd)]:border-r  "
            >
              {props.actionArgs.repositories?.map((repo: any) => (
                <label
                  key={repo.repoName}
                  className="flex items-center text-xs  border-b border-b-off-white/50 border-r-off-white/50 py-2 px-3"
                >
                  <input
                    className="text-secondary-orange focus:ring-0 focus:outline-none focus:border-none focus:bg-transparent outline-transparent"
                    type="radio"
                    id="chosenRepoData"
                    name="chosenRepoData"
                    value={[repo.repoName, repo.repoId]}
                    onClick={() => setRepoChosen(true)}
                  />
                  &nbsp;
                  {repo.repoName}
                </label>
              ))}
            </fieldset>
            {repoChosen && (
              <button
                type="submit"
                className="py-2 text-lg px-6 bg-secondary-orange border rounded-full border-off-white/50 absolute bottom-6 right-6"
              >
                {props.navigation.state == "submitting" &&
                props.navigation.formData &&
                props.navigation.formData.get("formType") == "getChosenRepo" ? (
                  <div className="ml-1 px-4 animate-spin">
                    <Loader size={28} />
                  </div>
                ) : (
                  <p>Submit</p>
                )}
              </button>
            )}
          </Form>
        </>
      )}
    </div>
  );
};
const SelectBranchComponent: React.FC<setupProps> = (props: setupProps) => {
  const data = props.dashboardType == "personal" ? props.userData : props.teamData;
  const [branchChosen, setBranchChosen] = useState(false);
  let submit = useSubmit();
  useEffect(() => {
    submit(
      {
        githubInstallationId: props.userData?.githubInstallationId as string,
        formType: "getBranchesOfChosenRepo",
      },
      {
        method: "post",
        encType: "application/x-www-form-urlencoded",
      }
    );
  }, []);
  return (
    <div className="h-full w-full">
      {props.actionArgs?.originCallForm != "getBranchesOfChosenRepo" ? (
        <div className="">
          {props.navigation.state == "submitting" &&
            props.navigation.formData &&
            props.navigation.formData.get("formType") == "getBranchesOfChosenRepo" && (
              <div className="flex flex-row items-center">
                Loading branches
                <div className="ml-1 animate-spin">
                  <Loader size={20} />
                </div>
              </div>
            )}
        </div>
      ) : (
        <>
          {data?.Repository?.branchName && <p>Current Branch: {data.Repository.branchName}</p>}
          {data?.Repository?.branchName && (
            <button
              onClick={() => props.updateStep(4)}
              className="py-2 text-lg px-6 bg-secondary-orange border rounded-full border-off-white/50 absolute bottom-6 right-6"
            >
              <p>Next</p>
            </button>
          )}
          <Form className="overflow-y-auto mt-4" method="post">
            <input
              type="hidden"
              name="githubInstallationId"
              value={props.userData?.githubInstallationId?.toString()}
            />
            <input type="hidden" name="formType" value="chooseBranch" />
            <fieldset
              id="repoSelector"
              className="grid grid-cols-2 [&>*:nth-child(odd)]:border-r border border-off-white/50"
            >
              {props.actionArgs.branches?.map((branchName: string) => (
                <label
                  key={branchName}
                  className="flex items-center text-xs  border-b border-b-off-white/50 border-r-off-white/50 py-2 px-3"
                >
                  <input
                    className="text-secondary-orange focus:ring-0 focus:outline-none focus:border-none focus:bg-transparent outline-transparent"
                    type="radio"
                    id="chosenBranch"
                    name="chosenBranch"
                    value={branchName}
                    onClick={() => setBranchChosen(true)}
                  />
                  &nbsp;
                  {branchName}
                </label>
              ))}
            </fieldset>
            <br />
            {branchChosen && (
              <button
                type="submit"
                className="py-2 text-lg px-6 bg-secondary-orange border rounded-full border-off-white/50 absolute bottom-6 right-6"
              >
                {props.navigation.state == "submitting" &&
                props.navigation.formData &&
                props.navigation.formData.get("formType") == "chooseBranch" ? (
                  <div className="ml-1 px-4 animate-spin">
                    <Loader size={28} />
                  </div>
                ) : (
                  <p>Submit</p>
                )}
              </button>
            )}
          </Form>
        </>
      )}
    </div>
  );
};
const SelectSmartContract: React.FC<setupProps> = (props: setupProps) => {
  const [fileChosen, setFileChosen] = useState(false);
  let submit = useSubmit();
  const data = props.dashboardType == "personal" ? props.userData : props.teamData;

  useEffect(() => {
    submit(
      {
        githubInstallationId: props.userData?.githubInstallationId as string,
        formType: "getFilesOfChosenRepo",
      },
      {
        method: "post",
        encType: "application/x-www-form-urlencoded",
      }
    );
  }, []);
  return (
    <div className="h-full w-full flex flex-col gap-4">
      {props.actionArgs?.originCallForm != "getFilesOfChosenRepo" && (
        <>
          <Form method="post">
            <input
              type="hidden"
              name="githubInstallationId"
              value={props.userData?.githubInstallationId as string}
            />
            <input type="hidden" name="formType" value="getFilesOfChosenRepo" />
            {props.navigation.state == "submitting" &&
            props.navigation.formData &&
            props.navigation.formData.get("formType") == "getFilesOfChosenRepo" ? (
              <div className="flex flex-row items-center">
                Loading files
                <div className="ml-1 animate-spin">
                  <Loader size={20} />
                </div>
              </div>
            ) : (
              <></>
              // <button
              //   type="submit"
              //   className="py-4 px-6 bg-secondary-orange border rounded-lg border-off-white/50"
              // >
              //   Click to load solidity files
              // </button>
            )}
          </Form>
        </>
      )}
      {props.actionArgs?.originCallForm == "getFilesOfChosenRepo" && (
        <>
          {data?.Repository?.filename && <div>Current File: {data?.Repository?.filename}</div>}
          {data?.Repository?.filename && (
            <button
              onClick={() => props.updateStep(5)}
              className="py-2 text-lg px-6 bg-secondary-orange border rounded-full border-off-white/50 absolute bottom-6 right-6"
            >
              <p>Next</p>
            </button>
          )}
          <Form method="post" className="w-full">
            <input
              type="hidden"
              name="githubInstallationId"
              value={props.userData?.githubInstallationId as string}
            />
            <input type="hidden" name="formType" value="chooseFileToTrack" />

            <fieldset
              id="repoSelector"
              className="grid grid-cols-2 [&>*:nth-child(odd)]:border-r border border-off-white/50"
            >
              {props.actionArgs.solFilesFromChosenRepo?.map((fileName: any, i: number) => (
                <label
                  key={fileName}
                  className="flex items-center text-xs  border-b border-b-off-white/50 border-r-off-white/50 py-2 px-3"
                >
                  <input
                    className="text-secondary-orange focus:ring-0 focus:outline-none focus:border-none focus:bg-transparent outline-transparent"
                    type="radio"
                    id="chosenFileName"
                    name="chosenFileName"
                    value={fileName}
                    onClick={() => setFileChosen(true)}
                  />
                  &nbsp;{fileName}
                </label>
              ))}
            </fieldset>

            {props.actionArgs.solFilesFromChosenRepo?.length == 0 && (
              <>No Solidity files found in selected repository.</>
            )}
            {fileChosen && (
              <button
                type="submit"
                className="flex flex-row py-2 text-lg px-6 bg-secondary-orange border rounded-full border-off-white/50 absolute bottom-6 right-6                "
              >
                {props.navigation.state == "submitting" &&
                props.navigation.formData &&
                props.navigation.formData.get("formType") == "chooseFileToTrack" ? (
                  <div className="ml-1 px-4 animate-spin">
                    <Loader size={28} />
                  </div>
                ) : (
                  <p>Submit</p>
                )}
              </button>
            )}
          </Form>
        </>
      )}
    </div>
  );
};

const SetDeployerComponent: React.FC<setupProps> = (props: setupProps) => {
  const [addressValid, setAddressValid] = useState<boolean>(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const data = props.dashboardType == "personal" ? props.userData : props.teamData;

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
    <div className="h-full w-full flex flex-col ">
      <Form method="post" className="w-full">
        <input
          type="hidden"
          name="githubInstallationId"
          value={props.userData?.githubInstallationId as string}
        />
        <input type="hidden" name="formType" value="setDeployerAddress" />
        <label className="text-off-white/75 text-xs">Ethereum Address</label>
        <input
          className="text-base text-center w-full h-16 outline-none border border-off-white/50 focus:ring-0 text-black  px-2 flex-1 bg-transparent"
          name="deployerAddress"
          placeholder="Input deployer address"
          onChange={handleAddressChange}
        />
        <button
          className="mt-6 text-xl disabled:bg-tertiary-gray bg-secondary-orange py-2 px-6 rounded-full flex items-center align-middle justify-center"
          type="submit"
          disabled={!addressValid}
        >
          <p>Confirm Address</p>
        </button>
      </Form>
      <p className="text-red-500 mt-10">{addressError}</p>
      {data?.Repository?.deployerAddress && (
        <div>Current Deployer: {data?.Repository?.deployerAddress}</div>
      )}
      {data?.Repository?.deployerAddress && (
        <button
          onClick={() => props.updateStep(6)}
          className="py-2 text-lg px-6 bg-secondary-orange border rounded-full border-off-white/50 absolute bottom-6 right-6"
        >
          <p>Next</p>
        </button>
      )}
    </div>
  );
};

const DeployContractComponent: React.FC<setupProps> = (props: setupProps) => {
  let data = props.dashboardType == "personal" ? props.userData : props.teamData;

  if (!data?.Repository?.contractAbi) throw new Error("No contract abi found");

  const parsedAbi = Abi.parse(JSON.parse(data.Repository.contractAbi));

  return (
    <div className="h-full w-full flex ">
      <Form method="post">
        {parsedAbi[0].type == "constructor" &&
          parsedAbi[0].inputs.length > 0 &&
          parsedAbi.map(
            (method, i) =>
              method.type == "constructor" &&
              method.inputs.length > 0 &&
              method.inputs.map((input, i) => (
                <input
                  type="text"
                  name={"constructorArg-" + i}
                  placeholder={input.type + " " + input.name}
                  className="bg-transparent rounded-lg ml-12"
                />
              ))
          )}
        <input
          type="hidden"
          name="numOfArgs"
          value={
            parsedAbi[0].type == "constructor" && parsedAbi[0].inputs.length > 0
              ? parsedAbi[0].inputs.length
              : 0
          }
        />
        <input
          type="hidden"
          name="githubInstallationId"
          value={props.userData?.githubInstallationId as string}
        />
        <input type="hidden" name="formType" value="deployContract" />
        {props.navigation.state == "submitting" &&
        props.navigation.formData &&
        props.navigation.formData.get("formType") == "deployContract" ? (
          <div className="mt-8 ml-1 px-4 animate-spin">
            <Loader size={28} />
          </div>
        ) : (
          <button
            type="submit"
            className="mt-8 py-3 px-6 text-xl bg-secondary-orange rounded-full border-off-white/50"
          >
            Deploy Contract
          </button>
        )}
      </Form>
    </div>
  );
};

export const setupSteps: setupStep[] = [
  {
    stepNumber: "01",
    name: "Generate API Key",
    description: (
      <p>
        What will this be used for?
        <br />
        <br />
        Your Fether API Key will be used for all Fether tools including both the{" "}
        <span className="text-secondary-orange underline">
          FetherKit React Typescript module
        </span>{" "}
        as well as your personal{" "}
        <span className="text-secondary-orange underline">Fether RPC Url</span>.
      </p>
    ),
    iconUrl: "/images/key.svg",
    actionComponent: (props: setupProps) => (
      <GenerateKeyComponent
        dashboardType={props.dashboardType}
        userData={props.userData}
        teamData={props.teamData}
        navigation={props.navigation}
        actionArgs={props.actionArgs}
        updateStep={props.updateStep}
      />
    ),
  },
  {
    stepNumber: "02",
    name: "Install FetherKit App",
    description: (
      <p>
        What is this?
        <br />
        <br />
        The <span className="text-secondary-orange underline">FetherKit github app</span> allows
        Fether to track new code changes to your smart contracts. This enables Fether to provide you
        with an always up to date test deployment of your smart contract.
      </p>
    ),
    iconUrl: "/images/github.svg",
    actionComponent: (props: setupProps) => (
      <InstallGithubAppComponent
        dashboardType={props.dashboardType}
        userData={props.userData}
        teamData={props.teamData}
        navigation={props.navigation}
        actionArgs={props.actionArgs}
        updateStep={props.updateStep}
      />
    ),
  },
  {
    stepNumber: "03",
    name: "Select a Repository",
    description: (
      <p>
        Select which GitHub repository contains the smart contract that you would like Fether to be
        tracking. Only repositories you allowed when installing the FetherKit app will appear below.
      </p>
    ),
    iconUrl: "/images/folder.svg",
    actionComponent: (props: setupProps) => (
      <SelectRepoComponent
        dashboardType={props.dashboardType}
        userData={props.userData}
        teamData={props.teamData}
        navigation={props.navigation}
        actionArgs={props.actionArgs}
        updateStep={props.updateStep}
      />
    ),
  },
  {
    stepNumber: "04",
    name: "Select a Branch",
    description: <p>Select which branch you would like to track.</p>,
    iconUrl: "/images/folder.svg",
    actionComponent: (props: setupProps) => (
      <SelectBranchComponent
        dashboardType={props.dashboardType}
        userData={props.userData}
        teamData={props.teamData}
        navigation={props.navigation}
        actionArgs={props.actionArgs}
        updateStep={props.updateStep}
      />
    ),
  },
  {
    stepNumber: "05",
    name: "Select a Smart Contract",
    description: (
      <p>
        Select which solidity file from your chosen repository that you would like Fether to be
        tracking for you.
      </p>
    ),
    iconUrl: "/images/file.svg",
    actionComponent: (props: setupProps) => (
      <SelectSmartContract
        dashboardType={props.dashboardType}
        userData={props.userData}
        teamData={props.teamData}
        navigation={props.navigation}
        actionArgs={props.actionArgs}
        updateStep={props.updateStep}
      />
    ),
  },
  {
    stepNumber: "06",
    name: "Set Your Deployer Address",
    description: (
      <p>
        Set which Ethereum address you would like to be the deployer of your smart contract. This is
        the address that will have will have any deployer based ownership.
      </p>
    ),
    iconUrl: "/images/paperAirplane.svg",
    actionComponent: (props: setupProps) => (
      <SetDeployerComponent
        dashboardType={props.dashboardType}
        userData={props.userData}
        teamData={props.teamData}
        navigation={props.navigation}
        actionArgs={props.actionArgs}
        updateStep={props.updateStep}
      />
    ),
  },
  {
    stepNumber: "07",
    name: "Deploy Contract",
    description: (
      <p>
        You are all set up! Click below to deploy your first instance of a Fethered smart contract!
      </p>
    ),
    iconUrl: "/images/celebrate.svg",
    actionComponent: (props: setupProps) => (
      <DeployContractComponent
        dashboardType={props.dashboardType}
        userData={props.userData}
        teamData={props.teamData}
        navigation={props.navigation}
        actionArgs={props.actionArgs}
        updateStep={props.updateStep}
      />
    ),
  },
];
