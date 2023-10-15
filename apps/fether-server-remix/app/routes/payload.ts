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

    let associatedUserData = await db.user.findUnique({
      where: { githubInstallationId: installId as string },
      include: {
        ApiKey: true,
        Repository: {
          include: {
            Activity: true,
          },
        },
      },
    });

    if (
      associatedUserData &&
      associatedUserData.ApiKey &&
      associatedUserData.Repository &&
      associatedUserData.Repository.id == reqBody.repository.id
    ) {
      for (let i = 0; i < reqBody.commits.length; i++) {
        for (let j = 0; j < reqBody.commits[i].modified.length; j++)
          if (reqBody.commits[i].modified[j].slice(-3) == "sol") {
            let modifiedContractPath: string = reqBody.commits[i].modified[j];
            console.log("modified contract path: ", modifiedContractPath);

            let pathArray = modifiedContractPath.split("/");
            console.log("pathArray: ", pathArray);

            let fileName = pathArray.pop();

            if (associatedUserData.Repository.filename == fileName) {
              let rootDir = associatedUserData.Repository.foundryRootDir;
              let fileName = associatedUserData.Repository.filename;

              let userName = associatedUserData.Repository.repoName.split("/")[0];
              let repoName = associatedUserData.Repository.repoName.split("/")[1];

              let byteCodePath =
                rootDir + "/out/" + fileName + "/" + fileName?.split(".")[0] + ".json";

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

              let bytecode = validatedJSON.bytecode.object as `0x${string}`;
              let abi = Abi.parse(fileJSON.abi);
              let dbAbi = JSON.stringify(fileJSON.abi);
              let deployerAddress = associatedUserData.Repository.deployerAddress as `0x${string}`;

              ///
              const fetherChain = fetherChainFromKey(associatedUserData.ApiKey?.key as string);

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

              let deployHash = await walletClient.deployContract({
                abi,
                account: deployerAddress,
                bytecode,
              });

              await adminClient.stopImpersonatingAccount({ address: deployerAddress });

              await new Promise((r) => setTimeout(r, 5500));
              const transaction = await publicClient.getTransactionReceipt({
                hash: deployHash,
              });

              await db.transaction.create({
                data: {
                  txHash: deployHash,
                  repositoryId: associatedUserData.Repository.id,
                  functionName: "GitHub Deployment",
                },
              });

              await db.repository.update({
                where: { id: associatedUserData.Repository.id },
                data: {
                  contractAddress: transaction["contractAddress"],
                  contractAbi: dbAbi,
                  lastDeployed: new Date(),
                },
              });
            }
          }
      }
      return new Response(null, {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    } else {
      console.log("no api key found for this repo: ", reqBody.installation.id);
      return new Response(null, {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        statusText: "No api key found for this repo, please sign up at https://www.fether.xyz.",
      });
    }
  } catch (err) {
    console.log("ERROR OCCURED: \n", err);
    return new Response(null, {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      statusText: JSON.stringify(err),
    });
  }
};
