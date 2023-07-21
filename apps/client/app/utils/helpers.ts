import { Abi, AbiFunction } from "abitype/zod";
import { Chain, createPublicClient, createWalletClient, custom, http } from "viem";
import { AbiFunction as AbiFunctionType } from "abitype";
import { z } from "zod";
import { UserWithKeyRepoActivity } from "~/types";

export type ContractReturnItem = {
  name: string;
  value: any;
};
export type ContractReturn = { methodName: string; returnItems: ContractReturnItem[] };

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const zodFunctionReturnSchema = z.array(z.any());

export function truncateToDecimals(num: number, dec = 2) {
  const calcDec = Math.pow(10, dec);
  return Math.trunc(num * calcDec) / calcDec;
}

export const callContractFunction = async (
  methodString: AbiFunctionType,
  contractAbi: string,
  contractAddress: `0x${string}`,
  args: any[],
  apiKey: string
): Promise<ContractReturn> => {
  let parsedAbi = Abi.parse(JSON.parse(contractAbi));
  let method = AbiFunction.parse(methodString);

  let fetherChainFromApiKey = fetherChainFromKey(apiKey);

  if (method.stateMutability === "view" || method.stateMutability === "pure") {
    const publicClient = createPublicClient({
      chain: fetherChainFromApiKey,
      transport: http(),
    });
    let returnValue = await publicClient.readContract({
      address: contractAddress,
      abi: parsedAbi,
      functionName: method.name,
    });

    if (typeof returnValue != "object") {
      returnValue = [returnValue];
    }

    let parsedReturn = zodFunctionReturnSchema.parse(returnValue);

    let returnItems: ContractReturnItem[] = [];

    for (let i = 0; i < method.outputs.length; i++) {
      let newReturnItem: ContractReturnItem = {
        name: method.outputs[i].name ? (method.outputs[i].name as string) : method.outputs[i].type,
        value: parsedReturn[i].toString(),
      };
      returnItems.push(newReturnItem);
    }
    return { returnItems, methodName: method.name };
  } else {
    let walletClient = createWalletClient({
      chain: fetherChainFromApiKey,
      // @ts-ignore
      transport: custom(window.ethereum),
    });

    const [address] = await walletClient.getAddresses();
    const publicClient = createPublicClient({
      chain: fetherChainFromApiKey,
      transport: http(),
    });

    const { request } = await publicClient.simulateContract({
      account: address,
      address: contractAddress,
      abi: parsedAbi,
      functionName: method.name,
      args: args,
    });

    let tx = await walletClient.writeContract(request);

    return { returnItems: [{ name: "numbuh", value: 4 }], methodName: method.name };
  }
};

export function fetherChainFromKey(apikey: string): Chain {
  return {
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
        http: [
          `https://${
            process.env.NODE_ENV == "production"
              ? "fether-server.vercel.app"
              : "fether-testing.ngrok.app"
          }/rpc/${apikey}`,
        ],
      },
      public: {
        http: [
          `https://${
            process.env.NODE_ENV == "production"
              ? "fether-server.vercel.app"
              : "fether-testing.ngrok.app"
          }/rpc/${apikey}`,
        ],
      },
    },
    testnet: false,
  };
}

export const timeSince = (_date: any) => {
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
export const getFunctionArgsFromInput = (abiFunction: AbiFunctionType): any[] => {
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

export const determineSetupStep = (userData: UserWithKeyRepoActivity): number => {
  enum SetupSteps {
    "GenerateApiKey",
    "InstallFetherKitGithubApp",
    "SelectRepository",
    "SelectSmartContract",
    "SetDeployerAddress",
    "DeployContract",
    "Done",
    "Error",
  }

  if (!userData) return SetupSteps.Error;

  if (!userData.ApiKey) return SetupSteps.GenerateApiKey;

  if (!userData.githubInstallationId) return SetupSteps.InstallFetherKitGithubApp;

  if (!userData.Repository) return SetupSteps.SelectRepository;

  if (!userData.Repository.filename) return SetupSteps.SelectSmartContract;

  if (!userData.Repository.deployerAddress) return SetupSteps.SetDeployerAddress;

  if (!userData.Repository.contractAddress) return SetupSteps.DeployContract;
  else return SetupSteps.Error;
};
