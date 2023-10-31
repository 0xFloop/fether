import { db } from "~/utils/db.server";
import {
  Chain,
  createPublicClient,
  createTestClient,
  createWalletClient,
  http,
  parseEther,
} from "viem";
import { App as Octo } from "octokit";
import { zodContractBuildFileSchema } from "./octo.server";
import { Abi } from "abitype/zod";
import { RepoWithActivity, UserWithKeyRepoActivityTeam } from "~/types";
import { fetherChainFromKey } from "./helpers";
import { Repository } from "database";

function getGithubPk() {
  const githubAppPk = process.env.appPK as string;
  const formattedGithubAppPk = githubAppPk.replace(/\\n/g, "\n");
  return formattedGithubAppPk;
}

const octo = new Octo({
  appId: process.env.fetherGithubAppId as string,
  privateKey: getGithubPk(),
});

export const deployContract = async (
  githubInstallationId: string,
  repoData: RepoWithActivity,
  apiKey: string,
  deployerUsername: string,
  args: any[]
) => {
  if (!repoData) throw new Error("Not Found");
  if (!repoData?.foundryRootDir && repoData?.foundryRootDir != "") throw new Error("Not Found");
  const octokit = await octo.getInstallationOctokit(parseInt(githubInstallationId));

  let rootDir = repoData.foundryRootDir;
  let deployerAddress = repoData?.deployerAddress as `0x${string}`;
  let userName = repoData.repoName.split("/")[0];
  let repoName = repoData.repoName.split("/")[1];
  let fileName = repoData.filename;

  let byteCodePath = rootDir + "/out/" + fileName + "/" + fileName?.split(".")[0] + ".json";

  let contentsReq = await octokit.request(
    "GET /repos/{owner}/{repo}/contents/{path}?ref={branchName}",
    {
      owner: userName,
      repo: repoName,
      path: byteCodePath,
      branchName: repoData.branchName,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
        Accept: "application/vnd.github.raw",
      },
    }
  );
  let fileJSON = JSON.parse(contentsReq.data.toString());
  let validatedJSON = zodContractBuildFileSchema.parse(fileJSON);
  let bytecode = validatedJSON.bytecode.object as `0x${string}`;
  let abi = Abi.parse(fileJSON.abi);
  let dbAbi = JSON.stringify(fileJSON.abi);

  const fetherChain = fetherChainFromKey(apiKey);

  const walletClient = createWalletClient({
    chain: fetherChain,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: fetherChain,
    transport: http(),
  });

  const adminClient = createTestClient({
    chain: fetherChain,
    mode: "anvil",
    transport: http(),
  });

  if ((await publicClient.getBalance({ address: deployerAddress })) < 1) {
    await adminClient.setBalance({ address: deployerAddress, value: parseEther("1") });
  }

  await adminClient.impersonateAccount({
    address: deployerAddress,
  });

  const constructor = abi.find((x) => x.type == "constructor");

  let deployHash: `0x${string}` = "0x";
  if (constructor?.type == "constructor" && constructor.inputs.length > 0) {
    deployHash = await walletClient.deployContract({
      abi,
      account: deployerAddress,
      bytecode,
      args: args,
    });
  } else {
    deployHash = await walletClient.deployContract({
      abi,
      account: deployerAddress,
      bytecode,
    });
  }

  await adminClient.stopImpersonatingAccount({ address: deployerAddress });

  await new Promise((r) => setTimeout(r, 5500));
  const transaction = await publicClient.getTransactionReceipt({
    hash: deployHash,
  });

  let functionName = "User Deployment";
  let activity = repoData.Activity;
  if (activity) {
    for (let i = 0; i < activity.length; i++) {
      if (activity[i].functionName.includes("Deployment")) {
        functionName = "User Redeploy";
        break;
      }
    }
  }

  await db.transaction.create({
    data: {
      txHash: deployHash,
      repositoryId: repoData.id,
      callerUsername: deployerUsername,
      functionName,
    },
  });
  await db.repository.update({
    where: { id: repoData.id },
    data: {
      contractAddress: transaction["contractAddress"],
      contractAbi: dbAbi,
      lastDeployed: new Date(),
    },
  });
};

export const BaseFetherChain: Chain = {
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
        }/rpc/GlobalLoader`,
      ],
    },
    public: {
      http: [
        `https://${
          process.env.NODE_ENV == "production"
            ? "fether-server.vercel.app"
            : "fether-testing.ngrok.app"
        }/rpc/GlobalLoader`,
      ],
    },
  },
  testnet: false,
};
export const timeSince = (_date: any) => {
  var date = Date.parse(_date);
  if (isNaN(date)) {
    date = new Date(_date * 1000).getTime();
  }
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
