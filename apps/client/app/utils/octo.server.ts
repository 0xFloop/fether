import { App as Octo } from "octokit";
import { db } from "~/utils/db.server";
import { z } from "zod";

function getGithubPk() {
  const githubAppPk = process.env.appPK as string;
  const formattedGithubAppPk = githubAppPk.replace(/\\n/g, "\n");
  return formattedGithubAppPk;
}

const octo = new Octo({
  appId: process.env.fetherGithubAppId as string,
  privateKey: getGithubPk(),
});

export const hasGithubAppInstalled = async (githubUsername: string): Promise<string | null> => {
  let hasId = await octo.octokit
    .request("GET /users/{username}/installation", {
      username: githubUsername,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })
    .then((res) => {
      return res.data.id.toString();
    })
    .catch((err) => {
      return null;
    });

  return hasId;
};

export const getUserRepositories = async (githubInstallationId: string) => {
  const octokit = await octo.getInstallationOctokit(parseInt(githubInstallationId));

  let repositories = await octokit.request("GET /installation/repositories", {
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  return repositories;
};

export const getRootDir = async (githubInstallationId: string): Promise<string> => {
  try {
    const octokit = await octo.getInstallationOctokit(parseInt(githubInstallationId));

    let repoData = await db.user.findUnique({
      where: { githubInstallationId },
      include: { Repository: true },
    });

    let ownerName = repoData?.Repository?.repoName.split("/")[0];
    let repoName = repoData?.Repository?.repoName.split("/")[1];

    if (!ownerName || !repoName) throw new Error("No owner or repo name found");

    let repoRootFolder = await octokit.request("GET /repos/{owner}/{repo}/contents/", {
      owner: ownerName,
      repo: repoName,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
        Accept: "application/vnd.github.raw",
      },
    });

    for (let i = 0; i < repoRootFolder.data.length; i++) {
      if (repoRootFolder.data[i].type == "dir" && repoRootFolder.data[i].name == "apps") {
        let appsFolder = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
          owner: ownerName,
          repo: repoName,
          path: repoRootFolder.data[i].path,
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
            Accept: "application/vnd.github.raw",
          },
        });
        let zodAppsFolderArray = zodArrayOfGithubFiles.safeParse(appsFolder.data);

        if (!zodAppsFolderArray.success) throw new Error("No solidity src folder found");

        for (let j = 0; j < zodAppsFolderArray.data.length; j++) {
          if (
            zodAppsFolderArray.data[j].type == "dir" &&
            zodAppsFolderArray.data[j].name == "solidity"
          ) {
            await db.repository.update({
              where: { id: repoData?.Repository?.id },
              data: { foundryRootDir: zodAppsFolderArray.data[j].path },
            });
            return zodAppsFolderArray.data[j].path;
          }
        }
      } else if (repoRootFolder.data[i].name == "foundry.toml") {
        await db.repository.update({
          where: { id: repoData?.Repository?.id },
          data: { foundryRootDir: "" },
        });
      }
    }
    return "";
  } catch (e) {
    throw e;
  }
};
export const getRootDirTeam = async (
  teamId: string,
  githubInstallationId: string
): Promise<string> => {
  try {
    const octokit = await octo.getInstallationOctokit(parseInt(githubInstallationId));

    let repoData = await db.repository.findUnique({
      where: { teamId },
    });

    let ownerName = repoData?.repoName.split("/")[0];
    let repoName = repoData?.repoName.split("/")[1];

    if (!ownerName || !repoName) throw new Error("No owner or repo name found");

    let repoRootFolder = await octokit.request("GET /repos/{owner}/{repo}/contents/", {
      owner: ownerName,
      repo: repoName,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
        Accept: "application/vnd.github.raw",
      },
    });

    for (let i = 0; i < repoRootFolder.data.length; i++) {
      if (repoRootFolder.data[i].type == "dir" && repoRootFolder.data[i].name == "apps") {
        let appsFolder = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
          owner: ownerName,
          repo: repoName,
          path: repoRootFolder.data[i].path,
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
            Accept: "application/vnd.github.raw",
          },
        });
        let zodAppsFolderArray = zodArrayOfGithubFiles.safeParse(appsFolder.data);

        if (!zodAppsFolderArray.success) throw new Error("No solidity src folder found");

        for (let j = 0; j < zodAppsFolderArray.data.length; j++) {
          if (
            zodAppsFolderArray.data[j].type == "dir" &&
            zodAppsFolderArray.data[j].name == "solidity"
          ) {
            await db.repository.update({
              where: { id: repoData?.id },
              data: { foundryRootDir: zodAppsFolderArray.data[j].path },
            });
            return zodAppsFolderArray.data[j].path;
          }
        }
      } else if (repoRootFolder.data[i].name == "foundry.toml") {
        await db.repository.update({
          where: { id: repoData?.id },
          data: { foundryRootDir: "" },
        });
      }
    }
    return "";
  } catch (e) {
    throw e;
  }
};

export const getSolFileNames = async (
  githubInstallationId: string,
  foundryRootDir: string
): Promise<string[]> => {
  const octokit = await octo.getInstallationOctokit(parseInt(githubInstallationId));

  let repoData = await db.user.findUnique({
    where: { githubInstallationId },
    include: { Repository: true },
  });

  let ownerName = repoData?.Repository?.repoName.split("/")[0];
  let repoName = repoData?.Repository?.repoName.split("/")[1];

  let fileNames: string[] = [];

  if (!ownerName || !repoName) throw new Error("No owner or repo name found");

  let contractSrcFolder = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
    owner: ownerName,
    repo: repoName,
    path: foundryRootDir + "/src",
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
      Accept: "application/vnd.github.raw",
    },
  });

  let zodFileArray = zodArrayOfGithubFiles.safeParse(contractSrcFolder.data);

  if (!zodFileArray.success) throw new Error("No solidity src folder found");

  for (let i = 0; i < zodFileArray.data.length; i++) {
    if (zodFileArray.data[i].name.endsWith(".sol")) {
      fileNames.push(zodFileArray.data[i].name);
    }
  }

  return fileNames;
};

export const zodArrayOfGithubFiles = z.array(
  z.object({
    name: z.string(),
    type: z.string(),
    path: z.string(),
  })
);
export const zodContractBuildFileSchema = z.object({
  abi: z.array(z.object({})),
  bytecode: z.object({
    object: z.string().startsWith("0x"),
    linkReferences: z.object({}),
    sourceMap: z.string(),
  }),
  deployedBytecode: z.object({
    object: z.string().startsWith("0x"),
    linkReferences: z.object({}),
    sourceMap: z.string(),
  }),
  methodIdentifiers: z.object({}),
});
