import { App as Octo } from "octokit";
import { db } from "~/db.server";
import { z } from "zod";

function getGithubPk() {
  const githubAppPk = process.env.appPK as string;
  const formattedGithubAppPk = githubAppPk.replace(/\\n/g, "\n");
  return formattedGithubAppPk;
}

const octo = new Octo({ appId: "302483", privateKey: getGithubPk() });

export const getUserRepositories = async (githubInstallationId: string) => {
  const octokit = await octo.getInstallationOctokit(parseInt(githubInstallationId));

  let repositories = await octokit.request("GET /installation/repositories", {
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  return repositories;
};

export const getSolFileNames = async (githubInstallationId: string): Promise<String[]> => {
  const octokit = await octo.getInstallationOctokit(parseInt(githubInstallationId));

  let repoData = await db.user.findUnique({
    where: { githubInstallationId },
    include: { Repository: true },
  });

  let ownerName = repoData?.Repository?.name.split("/")[0];
  let repoName = repoData?.Repository?.name.split("/")[1];

  let fileNames: String[] = [];

  if (!ownerName || !repoName) throw new Error("No owner or repo name found");

  let contractSrcFolder = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
    owner: ownerName,
    repo: repoName,
    path: "/apps/solidity/src",
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
      Accept: "application/vnd.github.raw",
    },
  });

  let zodFileArray = zodArrayOfGithubFiles.safeParse(contractSrcFolder.data);

  if (!zodFileArray.success) throw new Error("No solidity src folder found");

  for (let i = 0; i < zodFileArray.data.length; i++) {
    fileNames.push(zodFileArray.data[i].name);
  }

  return fileNames;
};

export const zodArrayOfGithubFiles = z.array(
  z.object({
    name: z.string(),
  })
);
