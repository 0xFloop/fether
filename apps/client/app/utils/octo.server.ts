import { App as Octo } from "octokit";

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
