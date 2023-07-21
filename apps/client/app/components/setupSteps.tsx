import { Form, useActionData, useNavigation } from "@remix-run/react";
import { Loader } from "lucide-react";
import { ReactComponentElement, useState } from "react";
import { UserWithKeyRepoActivity } from "~/types";
import { SetupWizardProps } from "./SetupWizard";
import { action } from "~/routes/alpha.dashboard";

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
};

const GenerateKeyComponent: React.FC<setupProps> = (props: setupProps) => {
  return (
    <div className="h-full w-full flex items-center align-middle justify-center">
      <Form method="post" action="/keygen">
        <input type="hidden" name="userId" value={props.userData?.id} />
        <input type="hidden" name="formType" value="generateApiKey" />
        <button
          type="submit"
          className="py-4 px-6 bg-secondary-blue border rounded-lg border-[#6161FF]"
        >
          Generate Key
        </button>{" "}
      </Form>
    </div>
  );
};

const InstallGithubAppComponent: React.FC<setupProps> = (props: setupProps) => {
  return (
    <div className="h-full w-full flex items-center align-middle justify-center">
      <Form method="post" action="/gh-app-install">
        <button
          type="submit"
          className="py-4 px-6 bg-secondary-blue border rounded-lg border-[#6161FF]"
        >
          Click to add github FetherKit app
        </button>
      </Form>
    </div>
  );
};

const SelectRepoComponent: React.FC<setupProps> = (props: setupProps) => {
  const [repoChosen, setRepoChosen] = useState(false);
  return (
    <div>
      {!(props.actionArgs?.originCallForm == "getRepos") && (
        <Form method="post">
          <input
            type="hidden"
            name="githubInstallationId"
            value={props.userData?.githubInstallationId?.toString()}
          />
          <input type="hidden" name="formType" value="getAllRepos" />
          {props.navigation.state == "submitting" &&
          props.navigation.formData.get("formType") == "getAllRepos" ? (
            <div className="flex flex-row items-center">
              Loading repositories
              <div className="ml-5 animate-spin">
                <Loader size={30} />
              </div>
            </div>
          ) : (
            <button type="submit">Click to load repositories</button>
          )}
        </Form>
      )}
      {props.actionArgs?.originCallForm == "getRepos" && (
        <Form method="post" className=" ">
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
              className="py-3 px-5 bg-secondary-blue border rounded-lg border-[#6161FF] absolute bottom-7 right-10"
            >
              {props.navigation.state == "submitting" &&
              props.navigation.formData.get("formType") == "getChosenRepo" ? (
                <p>Submitting....</p>
              ) : (
                <p>Submit</p>
              )}
            </button>
          )}
        </Form>
      )}
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
      />
    ),
  },
  {
    stepNumber: "04",
    name: "Select Smart Contract",
    description:
      "Select which solidity file from your chosen repository that you would like Fether to be tracking for you.",
    iconUrl: "/images/file.svg",
    actionComponent: (props: setupProps) => <div></div>,
  },
  {
    stepNumber: "05",
    name: "Set Deployer Address",
    description:
      "Set which Ethereum address you would like to be the deployer of your smart contract. This is the address that will have will have any deployer based ownership.",
    iconUrl: "/images/paperAirplane.svg",
    actionComponent: (props: setupProps) => <div></div>,
  },
  {
    stepNumber: "06",
    name: "Deploy Contract",
    description:
      "You are all set up! Click below to deploy your first instance of a Fethered smart contract!",
    iconUrl: "/images/celebrate.svg",
    actionComponent: (props: setupProps) => <div></div>,
  },
];
