import { db } from "~/db.server";
import { Chain, createPublicClient, createTestClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { App as Octo } from "octokit";
import { zodContractBuildFileSchema } from "./octo.server";
import { Abi, AbiParameter } from "abitype/zod";

function getGithubPk() {
  const githubAppPk = process.env.appPK as string;
  const formattedGithubAppPk = githubAppPk.replace(/\\n/g, "\n");
  return formattedGithubAppPk;
}

const octo = new Octo({ appId: "302483", privateKey: getGithubPk() });

export const fetherChain: Chain = {
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
      http: [`https://fether-testing.ngrok.app/rpc/${process.env.API_KEY as string}`],
    },
    public: { http: [`https://fether-testing.ngrok.app/rpc/${process.env.API_KEY as string}`] },
  },
  testnet: false,
};

const pkaccount = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
);

export const deployerAddress = pkaccount.address;

export const walletClient = createWalletClient({
  account: deployerAddress,
  chain: fetherChain,
  transport: http(),
});

export const publicClient = createPublicClient({
  chain: fetherChain,
  transport: http(),
});

export const adminClient = createTestClient({
  chain: fetherChain,
  mode: "anvil",
  transport: http(),
});

export const deployContract = async (githubInstallationId: string) => {
  const octokit = await octo.getInstallationOctokit(parseInt(githubInstallationId));

  let repoData = await db.user.findUnique({
    where: { githubInstallationId },
    include: {
      Repository: {
        include: {
          Activity: true,
        },
      },
    },
  });

  if (!repoData?.Repository?.foundryRootDir) throw new Error("No repo data found");

  let rootDir = repoData.Repository.foundryRootDir;
  let fileName = repoData.Repository.filename;

  let userName = repoData.Repository.name.split("/")[0];
  let repoName = repoData.Repository.name.split("/")[1];

  let byteCodePath = rootDir + "/out/" + fileName + "/" + fileName?.split(".")[0] + ".json";

  console.log(byteCodePath);

  let contentsReq = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
    owner: userName,
    repo: repoName,
    path: byteCodePath,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
      Accept: "application/vnd.github.raw",
    },
  });

  let fileJSON = JSON.parse(contentsReq.data.toString());
  let validatedJSON = zodContractBuildFileSchema.parse(fileJSON);
  let byteCode = validatedJSON.bytecode.object as `0x${string}`;
  let abi = Abi.parse(fileJSON.abi);
  let dbAbi = JSON.stringify(fileJSON.abi);
  let deployHash = await walletClient.deployContract({
    bytecode: byteCode,
    abi: abi,
  });
  await new Promise((r) => setTimeout(r, 5500));
  const transaction = await publicClient.getTransactionReceipt({
    hash: deployHash,
  });

  let functionName = "Deployment";
  let activity = repoData.Repository.Activity;
  for (let i = 0; i < activity.length; i++) {
    if (activity[i].functionName === "Deployment") {
      functionName = "Redeploy";
    }
  }

  await db.transaction.create({
    data: {
      txHash: deployHash,
      repositoryId: repoData.Repository.id,
      functionName,
    },
  });
  await db.repository.update({
    where: { id: repoData.Repository.id },
    data: {
      contractAddress: transaction["contractAddress"],
      contractAbi: dbAbi,
      updatedAt: new Date(),
    },
  });
};
