import { ActionArgs, redirect } from "@vercel/remix";
import { db } from "../utils/db.server";
import { zodContractBuildFileSchema, formattedGithubAppPk } from "~/utils/config";
import { App as Octo } from "octokit";
import { Abi } from "abitype/zod";
import { fetherChainFromKey, publicClient, walletClient } from "~/utils/viemClients";
import { createPublicClient, createTestClient, createWalletClient, http, parseEther } from "viem";

const octo = new Octo({
  appId: process.env.fetherGithubAppId as string,
  privateKey: formattedGithubAppPk,
});

export const action = async ({ request }: ActionArgs) => {
  try {
    const reqBody = await request.json();

    let installId = reqBody.installation.id.toString();

    const octokit = await octo.getInstallationOctokit(installId);

    let associatedRepositories = await db.repository.findMany({
      where: { repoId: reqBody.repository.id.toString() },
      include: {
        associatedUser: { include: { ApiKey: true } },
        associatedTeam: { include: { ApiKey: true } },
      },
    });

    for (let i = 0; i < associatedRepositories.length; i++) {
      let associatedRepo = associatedRepositories[i];
      let branchChanged = reqBody.ref.split("/").slice(-1)[0] == associatedRepo.branchName;
      let associatedData = associatedRepo.associatedUser
        ? associatedRepo.associatedUser
        : associatedRepo.associatedTeam;

      if (!branchChanged) {
        console.log("branch changed, but not the one we're looking for");
        continue;
      }
      console.log("correct branch changed");

      if (associatedData?.ApiKey) {
        for (let i = 0; i < reqBody.commits.length; i++) {
          for (let j = 0; j < reqBody.commits[i].modified.length; j++)
            if (reqBody.commits[i].modified[j].slice(-3) == "sol") {
              let modifiedContractPath: string = reqBody.commits[i].modified[j];

              let pathArray = modifiedContractPath.split("/");

              let fileName = pathArray.pop();

              if (associatedRepo.filename == fileName) {
                let rootDir = associatedRepo.foundryRootDir;
                let fileName = associatedRepo.filename;

                let userName = associatedRepo.repoName.split("/")[0];
                let repoName = associatedRepo.repoName.split("/")[1];

                let byteCodePath =
                  rootDir + "/out/" + fileName + "/" + fileName?.split(".")[0] + ".json";

                let contentsReq = await octokit.request(
                  "GET /repos/{owner}/{repo}/contents/{path}/?ref={branchName}",
                  {
                    owner: userName,
                    repo: repoName,
                    path: byteCodePath,
                    branchName: associatedRepo.branchName,
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
                console.log(abi);
                let dbAbi = JSON.stringify(fileJSON.abi);
                let deployerAddress = associatedRepo.deployerAddress as `0x${string}`;

                const fetherChain = fetherChainFromKey(associatedData.ApiKey?.key as string);

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
                  await adminClient.setBalance({
                    address: deployerAddress,
                    value: parseEther("1"),
                  });
                }

                await adminClient.impersonateAccount({
                  address: deployerAddress,
                });

                let deployHash = await walletClient.deployContract({
                  abi,
                  account: deployerAddress,
                  bytecode,
                  args: associatedRepo.cachedConstructorArgs
                    ? JSON.parse(associatedRepo.cachedConstructorArgs)
                    : [],
                });

                await adminClient.stopImpersonatingAccount({ address: deployerAddress });

                await new Promise((r) => setTimeout(r, 5500));
                const transaction = await publicClient.getTransactionReceipt({
                  hash: deployHash,
                });

                await db.transaction.create({
                  data: {
                    txHash: deployHash,
                    repositoryId: associatedRepo.id,
                    functionName: "GitHub Deployment",
                  },
                });

                await db.repository.update({
                  where: { id: associatedRepo.id },
                  data: {
                    contractAddress: transaction["contractAddress"],
                    contractAbi: dbAbi,
                    lastDeployed: new Date(),
                  },
                });
              }
            }
        }
      } else {
        console.log("no api key found for this repo: ", reqBody.installation.id);
        return new Response(null, {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" },
          statusText: "No api key found for this repo, please sign up at https://www.fether.xyz.",
        });
      }
    }
    return new Response(null, {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    console.log("ERROR OCCURED: \n", err);
    return new Response(null, {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      statusText: JSON.stringify(err),
    });
  }
};
