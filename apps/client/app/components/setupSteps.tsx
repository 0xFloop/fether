import { Form, useActionData, useNavigation, useSubmit } from "@remix-run/react";
import { Loader } from "lucide-react";
import { ReactComponentElement, useEffect, useState } from "react";
import { UserWithKeyRepoActivity } from "~/types";
import { SetupWizardProps } from "./SetupWizard";
import { action } from "~/routes/alpha.dashboard";
import { isAddress } from "viem";

type setupStep = {
  stepNumber: string;
  name: string;
  description: string;
  iconUrl: string;
  actionComponent: (props: setupProps) => JSX.Element;
};

type setupProps = {
  userData: UserWithKeyRepoActivity;
  navigation: ReturnType<typeof useNavigation>;
  actionArgs: ReturnType<typeof useActionData<typeof action>>;
  updateStep: (step: number) => void;
};

const GenerateKeyComponent: React.FC<setupProps> = (props: setupProps) => {
  return (
    <div className="h-full w-full flex items-center align-middle justify-center">
      <Form method="post" action="/api/keygen">
        <input type="hidden" name="userId" value={props.userData?.id} />
        <input type="hidden" name="formType" value="generateApiKey" />

        <button
          disabled={props.navigation.state === "submitting"}
          type="submit"
          className="py-4 px-6 bg-accent border rounded-lg flex flex-row border-[#6161FF]"
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
        </button>
      </Form>
    </div>
  );
};

const InstallGithubAppComponent: React.FC<setupProps> = (props: setupProps) => {
  return (
    <div className="h-full w-full flex items-center align-middle justify-center">
      <Form method="post" action="/api/gh-app-install">
        <button type="submit" className="py-4 px-6 bg-accent border rounded-lg border-[#6161FF]">
          Click to add github FetherKit app
        </button>
      </Form>
    </div>
  );
};

const SelectRepoComponent: React.FC<setupProps> = (props: setupProps) => {
  const [repoChosen, setRepoChosen] = useState(false);
  let submit = useSubmit();
  useEffect(() => {
    submit(
      {
        githubInstallationId: props.userData?.githubInstallationId?.toString() as string,
        formType: "getAllRepos",
      },
      {
        method: "post",
        encType: "application/x-www-form-urlencoded",
      }
    );
  }, []);

  return (
    <div className="h-full w-full flex flex-col gap-4 items-center">
      {props.actionArgs?.originCallForm != "getRepos" ? (
        <div className="h-full w-full flex justify-center">
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
          {props.userData?.Repository?.name && (
            <p>Current Repo: {props.userData?.Repository?.name}</p>
          )}
          {props.userData?.Repository?.name && (
            <button
              onClick={() => props.updateStep(3)}
              className="py-3 px-5 bg-accent border rounded-lg border-[#6161FF] absolute bottom-7 right-10"
            >
              <p>Next</p>
            </button>
          )}
          <Form className="overflow-scroll" method="post">
            <input
              type="hidden"
              name="githubInstallationId"
              value={props.userData?.githubInstallationId?.toString()}
            />
            <input type="hidden" name="formType" value="getChosenRepo" />

            <fieldset id="repoSelector" className="grid grid-cols-2">
              {props.actionArgs.repositories?.map((repo: any) => (
                <label key={repo.repoName} className="text-xl">
                  <input
                    type="radio"
                    id="chosenRepoData"
                    name="chosenRepoData"
                    value={[repo.repoName, repo.repoId]}
                    onClick={() => setRepoChosen(true)}
                  />{" "}
                  {repo.repoName}
                </label>
              ))}
            </fieldset>
            <br />
            {repoChosen && (
              <button
                type="submit"
                className="py-3 px-5 bg-accent border rounded-lg border-[#6161FF]  absolute bottom-7 right-10"
              >
                {props.navigation.state == "submitting" &&
                props.navigation.formData &&
                props.navigation.formData.get("formType") == "getChosenRepo" ? (
                  <div className="flex flex-row items-center">
                    Submitting
                    <div className="ml-1 animate-spin">
                      <Loader size={20} />
                    </div>
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
  useEffect(() => {
    submit(
      {
        githubInstallationId: props.userData?.githubInstallationId?.toString() as string,
        formType: "getFilesOfChosenRepo",
      },
      {
        method: "post",
        encType: "application/x-www-form-urlencoded",
      }
    );
  }, []);
  return (
    <div className="h-full w-full flex flex-col gap-4 items-center align-middle justify-center">
      {props.actionArgs?.originCallForm != "getFilesOfChosenRepo" && (
        <>
          <Form method="post">
            <input
              type="hidden"
              name="githubInstallationId"
              value={props.userData?.githubInstallationId?.toString()}
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
              //   className="py-4 px-6 bg-accent border rounded-lg border-[#6161FF]"
              // >
              //   Click to load solidity files
              // </button>
            )}
          </Form>
        </>
      )}
      {props.actionArgs?.originCallForm == "getFilesOfChosenRepo" && (
        <>
          {props.userData?.Repository?.filename && (
            <div>Current File: {props.userData?.Repository?.filename}</div>
          )}
          {props.userData?.Repository?.filename && (
            <button
              onClick={() => props.updateStep(4)}
              className="py-3 px-5 bg-accent border rounded-lg border-[#6161FF] absolute bottom-7 right-10"
            >
              <p>Next</p>
            </button>
          )}
          <Form method="post" className="w-full">
            <input
              type="hidden"
              name="githubInstallationId"
              value={props.userData?.githubInstallationId?.toString()}
            />
            <input type="hidden" name="formType" value="chooseFileToTrack" />
            <fieldset className="grid grid-cols-2">
              {props.actionArgs.solFilesFromChosenRepo?.map((fileName: any, i: number) => (
                <label key={i} className="text-xl text-center flex justify-center items-center">
                  <input
                    onClick={() => setFileChosen(true)}
                    type="radio"
                    name="chosenFileName"
                    value={fileName}
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
                className="flex flex-row items-center py-3 px-5 bg-accent border rounded-lg border-[#6161FF] absolute bottom-7 right-10"
              >
                {props.navigation.state == "submitting" &&
                props.navigation.formData &&
                props.navigation.formData.get("formType") == "chooseFileToTrack" ? (
                  <div className=" flex flex-row items-center">
                    <p>Submitting</p>
                    <div className="ml-1 animate-spin">
                      <Loader size={20} />
                    </div>
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
    <div className="h-full w-full flex flex-col items-center ">
      <Form method="post" className="w-full">
        <input
          type="hidden"
          name="githubInstallationId"
          value={props.userData?.githubInstallationId?.toString()}
        />
        <input type="hidden" name="formType" value="setDeployerAddress" />
        <div className="flex flex-row items-center justify-between w-full h-14">
          <input
            className="text-lg h-full outline-none text-black rounded-l-lg px-2 flex-1 bg-[#D9D9D9]"
            name="deployerAddress"
            placeholder="Input desired contract deployer address"
            onChange={handleAddressChange}
          />
          <button
            className="text-white h-full text-xl disabled:bg-tertiary-gray bg-accent py-2 px-4 border rounded-r-lg"
            type="submit"
            disabled={!addressValid}
          >
            {props.navigation.state == "submitting" &&
            props.navigation.formData &&
            props.navigation.formData.get("formType") == "setDeployerAddress" ? (
              <div className="animate-spin">
                <Loader size={20} />
              </div>
            ) : (
              <p>Confirm</p>
            )}
          </button>
        </div>
      </Form>
      <p className="text-red-500 mt-10">{addressError}</p>
      {props.userData?.Repository?.deployerAddress && (
        <div>Current Deployer: {props.userData?.Repository?.deployerAddress}</div>
      )}
      {props.userData?.Repository?.deployerAddress && (
        <button
          onClick={() => props.updateStep(5)}
          className="py-3 px-5 bg-accent border rounded-lg border-[#6161FF] absolute bottom-7 right-10"
        >
          <p>Next</p>
        </button>
      )}
    </div>
  );
};

const DeployContractComponent: React.FC<setupProps> = (props: setupProps) => {
  return (
    <div className="h-full w-full flex items-center align-middle justify-center">
      <Form method="post">
        <input
          type="hidden"
          name="githubInstallationId"
          value={props.userData?.githubInstallationId?.toString()}
        />
        <input type="hidden" name="formType" value="deployContract" />
        {props.navigation.state == "submitting" &&
        props.navigation.formData &&
        props.navigation.formData.get("formType") == "deployContract" ? (
          <div className="flex flex-row items-center py-4 px-6 bg-accent border rounded-lg border-[#6161FF]">
            Deploying{" "}
            <div className="ml-1 animate-spin">
              <Loader size={20} />
            </div>
          </div>
        ) : (
          <button type="submit" className="py-4 px-6 bg-accent border rounded-lg border-[#6161FF]">
            Click here to deploy your contract
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
    description:
      "Your Fether API Key will be used for external FetherKit use including both the FetherKit React Typescript package as well as your personal Fether RPC Url.",
    iconUrl: "/images/key.svg",
    actionComponent: (props: setupProps) => (
      <GenerateKeyComponent
        userData={props.userData}
        navigation={props.navigation}
        actionArgs={props.actionArgs}
        updateStep={props.updateStep}
      />
    ),
  },
  {
    stepNumber: "02",
    name: "Install FetherKit Github App",
    description:
      "The FetherKit github app allows Fether to track new code changes to your smart contracts. This allows Fether to provide you with an always up to date deployment of your smart contract.",
    iconUrl: "/images/github.svg",
    actionComponent: (props: setupProps) => (
      <InstallGithubAppComponent
        userData={props.userData}
        navigation={props.navigation}
        actionArgs={props.actionArgs}
        updateStep={props.updateStep}
      />
    ),
  },
  {
    stepNumber: "03",
    name: "Select Repository",
    description:
      "Select which GitHub repository contains the smart contract that you would like Fether to be tracking. Only repositories you allowed when installing the FetherKit app will appear below.",
    iconUrl: "/images/folder.svg",
    actionComponent: (props: setupProps) => (
      <SelectRepoComponent
        userData={props.userData}
        navigation={props.navigation}
        actionArgs={props.actionArgs}
        updateStep={props.updateStep}
      />
    ),
  },
  {
    stepNumber: "04",
    name: "Select Smart Contract",
    description:
      "Select which solidity file from your chosen repository that you would like Fether to be tracking for you.",
    iconUrl: "/images/file.svg",
    actionComponent: (props: setupProps) => (
      <SelectSmartContract
        userData={props.userData}
        navigation={props.navigation}
        actionArgs={props.actionArgs}
        updateStep={props.updateStep}
      />
    ),
  },
  {
    stepNumber: "05",
    name: "Set Deployer Address",
    description:
      "Set which Ethereum address you would like to be the deployer of your smart contract. This is the address that will have will have any deployer based ownership.",
    iconUrl: "/images/paperAirplane.svg",
    actionComponent: (props: setupProps) => (
      <SetDeployerComponent
        userData={props.userData}
        navigation={props.navigation}
        actionArgs={props.actionArgs}
        updateStep={props.updateStep}
      />
    ),
  },
  {
    stepNumber: "06",
    name: "Deploy Contract",
    description:
      "You are all set up! Click below to deploy your first instance of a Fethered smart contract!",
    iconUrl: "/images/celebrate.svg",
    actionComponent: (props: setupProps) => (
      <DeployContractComponent
        userData={props.userData}
        navigation={props.navigation}
        actionArgs={props.actionArgs}
        updateStep={props.updateStep}
      />
    ),
  },
];
