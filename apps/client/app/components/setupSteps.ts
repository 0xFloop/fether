type setupStep = {
  stepNumber: string;
  name: string;
  description: string;
  iconUrl: string;
};

export const setupSteps: setupStep[] = [
  {
    stepNumber: "01",
    name: "Generate API Key",
    description:
      "Your Fether API Key will be used for external FetherKit use including both the FetherKit React Typescript package as well as your personal Fether RPC Url.",
    iconUrl: "~/images/key.svg",
  },
  {
    stepNumber: "02",
    name: "Install FetherKit Github App",
    description:
      "The FetherKit github app allows Fether to track new code changes to your smart contracts. This allows Fether to provide you with an always up to date deployment of your smart contract.",
    iconUrl: "~/images/github.svg",
  },
  {
    stepNumber: "03",
    name: "Select Repository",
    description:
      "Select which GitHub repository contains the smart contract that you would like Fether to be tracking. Only repositories you allowed when installing the FetherKit app will appear below.",
    iconUrl: "~/images/folder.svg",
  },
  {
    stepNumber: "04",
    name: "Select Smart Contract",
    description:
      "Select which solidity file from your chosen repository that you would like Fether to be tracking for you.",
    iconUrl: "~/images/file.svg",
  },
  {
    stepNumber: "05",
    name: "Set Deployer Address",
    description:
      "Set which Ethereum address you would like to be the deployer of your smart contract. This is the address that will have will have any deployer based ownership.",
    iconUrl: "~/images/paperAirplane.svg",
  },
  {
    stepNumber: "06",
    name: "Deploy Contract",
    description:
      "You are all set up! Click below to deploy your first instance of a Fethered smart contract!",
    iconUrl: "~/images/celebrate.svg",
  },
];
