import { Abi, AbiFunction } from "abitype/zod";
import { Chain, createPublicClient, createWalletClient, custom, http } from "viem";
import { AbiFunction as AbiFunctionType } from "abitype";
import { z } from "zod";
import { Ethereum } from "@wagmi/core";

export type ContractReturnItem = {
  name: string;
  value: any;
};
export type ContractReturn = { methodName: string; returnItems: ContractReturnItem[] };

const zodFunctionReturnSchema = z.array(z.any());

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
      transport: custom(window.ethereum as Ethereum),
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
        http: [`https://fether-testing.ngrok.app/rpc/${apikey}`],
      },
      public: { http: [`https://fether-testing.ngrok.app/rpc/${apikey}`] },
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
