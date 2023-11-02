import { Abi, AbiFunction } from "abitype/zod";
import { Chain, createPublicClient, createWalletClient, custom, http } from "viem";
import { AbiFunction as AbiFunctionType } from "abitype";
import { z } from "zod";
import {
  ContractReturn,
  ContractReturnItem,
  TeamWithKeyRepoActivityMembers,
  TxDetails,
  UserWithKeyRepoActivityTeam,
} from "~/types";

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const zodFunctionReturnSchema = z.array(z.any());

export function spacify(str: string) {
  let spacedStr = str.replace("-", " ").replace("_", " ");
  let splitStr = spacedStr.split(" ");
  for (let i = 0; i < splitStr.length; i++) {
    splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].slice(1);
  }
  return splitStr.join(" ");
}
export const zodTeamName = z
  .string()
  .min(3)
  .max(20)
  .regex(/^[a-zA-Z0-9_-]*$/);

export function truncateToDecimals(num: number, dec = 2) {
  const calcDec = Math.pow(10, dec);
  return Math.trunc(num * calcDec) / calcDec;
}

export function makeId(length: number) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export const getTransactionDetails = async (
  txHash: string,
  apiKey: string
): Promise<TxDetails | null> => {
  const publicClient = createPublicClient({
    chain: fetherChainFromKey(apiKey as string),
    transport: http(),
  });

  let txReciept = await publicClient.getTransactionReceipt({
    hash: txHash as `0x${string}`,
  });

  if (txReciept) {
    return {
      hash: txReciept.transactionHash,
      blockNumber: Number(txReciept.blockNumber),
      from: txReciept.from,
      to: txReciept.to,
      created: txReciept.contractAddress,
      gasUsed: Number(txReciept.cumulativeGasUsed),
      maxPriorityFee: Number(txReciept.effectiveGasPrice),
      maxFee: Number(txReciept.effectiveGasPrice),
      gasPrice: Number(txReciept.effectiveGasPrice),
      transactionFeeWei: Number(txReciept.effectiveGasPrice) * Number(txReciept.cumulativeGasUsed),
      status: txReciept.status,
      timestamp: Number(
        (await publicClient.getBlock({ blockNumber: txReciept.blockNumber })).timestamp
      ),
    };
  }

  return null;
};

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
      args: args,
    });

    if (typeof returnValue != "object") {
      returnValue = [returnValue];
    }

    let parsedReturn = zodFunctionReturnSchema.parse(returnValue);

    let returnItems: ContractReturnItem[] = [];

    for (let i = 0; i < method.outputs.length; i++) {
      let newReturnItem: ContractReturnItem = {
        type: method.outputs[i].type,
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

    const { result, request } = await publicClient.simulateContract({
      account: address,
      address: contractAddress,
      abi: parsedAbi,
      functionName: method.name,
      args: args,
    });

    let returnItems: ContractReturnItem[] = [];
    if (typeof result == "object") {
      for (let i = 0; i < method.outputs.length; i++) {
        let newReturnItem: ContractReturnItem = {
          type: method.outputs[i].type,
          name: method.outputs[i].name
            ? (method.outputs[i].name as string)
            : method.outputs[i].type,
          value: result[i].toString(),
        };
        returnItems.push(newReturnItem);
      }
    } else {
      if (method.outputs.length != 0) {
        let newReturnItem: ContractReturnItem = {
          type: method.outputs[0].type,
          name: method.outputs[0].name
            ? (method.outputs[0].name as string)
            : method.outputs[0].type,
          value: result?.toString(),
        };
        returnItems.push(newReturnItem);
      }
    }

    let tx = await walletClient.writeContract(request);
    return {
      returnItems: returnItems,
      methodName: method.name,
    };
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
  if (typeof _date === "number") _date = new Date(_date * 1000);

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
    if (abiFunction.inputs[i].type == "tuple") {
      let argStruct: { [key: string]: string } = {};
      for (let j = 0; j < abiFunction.inputs[i].components.length; j++) {
        const inputElement = document.getElementById(
          `${abiFunction.name}-${abiFunction.inputs[i].name}-${abiFunction.inputs[i].components[j].name}`
        ) as HTMLInputElement;

        let val: any = inputElement.value;

        let key = abiFunction.inputs[i].components[j].name as string;
        argStruct[key] = val;
      }

      args.push(argStruct);
    } else {
      const inputElement = document.getElementById(
        `${abiFunction.name}-${abiFunction.inputs[i].name}`
      ) as HTMLInputElement;

      const val = inputElement.value;

      args.push(val);
    }
  }

  return args;
};
export enum SetupStepsEnum {
  "GenerateApiKey",
  "InstallFetherKitGithubApp",
  "SelectRepository",
  "SelectBranch",
  "SelectSmartContract",
  "SetDeployerAddress",
  "DeployContract",
  "Done",
  "Error",
}

export const determineSetupStep = (
  userData: UserWithKeyRepoActivityTeam | null,
  teamData: TeamWithKeyRepoActivityMembers | null
): number => {
  if (userData) {
    if (!userData.ApiKey) return SetupStepsEnum.GenerateApiKey;

    if (!userData.githubInstallationId) return SetupStepsEnum.InstallFetherKitGithubApp;

    if (!userData.Repository) return SetupStepsEnum.SelectRepository;

    if (!userData.Repository.branchName) return SetupStepsEnum.SelectBranch;

    if (!userData.Repository.filename) return SetupStepsEnum.SelectSmartContract;

    if (!userData.Repository.deployerAddress) return SetupStepsEnum.SetDeployerAddress;

    if (!userData.Repository.contractAddress) return SetupStepsEnum.DeployContract;

    if (userData.Repository.contractAddress) return SetupStepsEnum.Done;
    else return SetupStepsEnum.Error;
  } else if (teamData) {
    if (!teamData.ApiKey) return SetupStepsEnum.GenerateApiKey;

    if (!teamData.Repository) return SetupStepsEnum.SelectRepository;

    if (!teamData.Repository.branchName) return SetupStepsEnum.SelectBranch;

    if (!teamData.Repository.filename) return SetupStepsEnum.SelectSmartContract;

    if (!teamData.Repository.deployerAddress) return SetupStepsEnum.SetDeployerAddress;

    if (!teamData.Repository.contractAddress) return SetupStepsEnum.DeployContract;

    if (teamData.Repository.contractAddress) return SetupStepsEnum.Done;
    else return SetupStepsEnum.Error;
  } else {
    return SetupStepsEnum.Error;
  }
};

export const isSetup = (userData: UserWithKeyRepoActivityTeam): boolean => {
  if (
    userData &&
    userData.Repository &&
    userData.Repository.contractAddress &&
    userData.Repository.contractAbi &&
    userData.Repository.deployerAddress &&
    userData.Repository.filename &&
    userData.ApiKey &&
    userData.ApiKey.key
  ) {
    return true;
  }
  return false;
};
