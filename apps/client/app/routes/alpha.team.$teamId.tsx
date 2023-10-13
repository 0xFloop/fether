import { ActionArgs, LoaderArgs, V2_MetaFunction, json, redirect } from "@vercel/remix";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { db } from "../utils/db.server";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
} from "../utils/alphaSession.server";
import { Dashboard } from "~/components/Dashboard";
import { RepoData, TeamWithKeyRepoActivityMembers, returnedMemberData } from "~/types";
import SetupWizard from "~/components/SetupWizard";
import { determineSetupStep, spacify } from "~/utils/helpers";
import { useEffect, useState } from "react";
import { getRootDir, getSolFileNames, getUserRepositories } from "~/utils/octo.server";
import { deployContract } from "~/utils/viem.server";

export const loader = async ({ params, request }: LoaderArgs) => {
  const user = await userGetSession(request.headers.get("Cookie"));
  if (!user.has("userId")) throw redirect("/");
  let userId = user.get("userId");
  const teamData: TeamWithKeyRepoActivityMembers = await db.team.findUnique({
    where: { id: params.teamId },
    include: {
      ApiKey: true,
      Owner: true,
      InviteCodes: true,
      Members: true,
      Repository: {
        include: {
          Activity: {
            orderBy: {
              timestamp: "desc",
            },
          },
        },
      },
    },
  });
  if (!teamData) throw new Error("Team not found!");
  if (!teamData.Members?.find((member) => member.id === userId)) {
    throw new Error("You are not a member of this team! Contact the team owner to request access.");
  }
  const isOwner = teamData.ownerId === userId;

  const memberData: returnedMemberData[] = [];

  for (let i = 0; i < teamData.Members.length; i++) {
    memberData.push({
      username: teamData.Members[i].username,
      isOwner: teamData.Members[i].id === teamData.ownerId,
    });
  }
  let returnedTeamData = {
    members: memberData,
    name: teamData.name,
    id: teamData.id,
    repo: teamData.Repository,
  };
  let setupStep = determineSetupStep(null, teamData);

  return { returnedTeamData, isOwner, teamData, setupStep };
};
export const action = async ({ request }: ActionArgs) => {
  const body = await request.formData();
  const ownerGithubInstallationId = body.get("githubInstallationId");

  const teamFromUser = await db.user.findUnique({
    where: { githubInstallationId: ownerGithubInstallationId as string },
    include: {
      MemberTeam: {
        include: {
          Repository: { include: { Activity: true } },
          ApiKey: true,
          Members: true,
          InviteCodes: true,
          Owner: true,
        },
      },
    },
  });
  if (teamFromUser?.MemberTeam) {
    const team = teamFromUser.MemberTeam;
    try {
      const formType = body.get("formType");
      switch (formType) {
        case "getAllRepos":
          const repositories = await getUserRepositories(
            team.Owner?.githubInstallationId as string
          );
          const repoArray = repositories.data.repositories;
          const repoObjArray: RepoData[] = [];
          repoArray.map((repo: any) => {
            repoObjArray.push({ repoName: repo.full_name, repoId: repo.id.toString() });
          });

          return {
            originCallForm: "getRepos",
            chosenRepoName: null,
            repositories: repoObjArray,
            solFilesFromChosenRepo: null,
            chosenFileName: null,
            txDetails: null,
            error: null,
          };
        case "getChosenRepo":
          const chosenRepoData = body.get("chosenRepoData");

          if (chosenRepoData) {
            const chosenRepoName = chosenRepoData.toString().split(",")[0];
            const chosenRepoId = chosenRepoData.toString().split(",")[1];

            await db.repository.upsert({
              where: { teamId: team.id },
              create: {
                repoId: chosenRepoId as string,
                repoName: chosenRepoName as string,
                teamId: team.id,
              },
              update: {
                repoName: chosenRepoName as string,
                repoId: chosenRepoId as string,
                contractAbi: null,
                contractAddress: null,
                filename: null,
                foundryRootDir: null,
              },
            });
            await db.transaction.deleteMany({
              where: { repositoryId: team.Repository?.id as string },
            });
            return {
              originCallForm: "chooseRepo",
              chosenRepoName: chosenRepoName,
              repositories: null,
              solFilesFromChosenRepo: null,
              chosenFileName: null,
              txDetails: null,
              error: null,
            };
          }
          return {
            originCallForm: "chooseRepo",
            chosenRepoName: null,
            repositories: null,
            solFilesFromChosenRepo: null,
            chosenFileName: null,
            txDetails: null,
            error: null,
          };
        case "getFilesOfChosenRepo":
          let foundryRootDir = team.Repository?.foundryRootDir;
          if (!foundryRootDir) {
            foundryRootDir = await getRootDir(ownerGithubInstallationId as string);
          }
          let fileNameArray: string[] = await getSolFileNames(
            ownerGithubInstallationId as string,
            foundryRootDir as string
          );
          return {
            originCallForm: "getFilesOfChosenRepo",
            chosenRepoName: null,
            repositories: null,
            solFilesFromChosenRepo: fileNameArray,
            chosenFileName: null,
            txDetails: null,
            error: null,
          };
        case "chooseFileToTrack":
          await db.repository.update({
            where: { teamId: team.id },
            data: {
              filename: body.get("chosenFileName") ? (body.get("chosenFileName") as string) : null,
              contractAbi: null,
              contractAddress: null,
              deployerAddress: null,
            },
          });
          await db.transaction.deleteMany({
            where: { repositoryId: team.Repository?.id as string },
          });

          return {
            originCallForm: "chooseFileToTrack",
            chosenRepoName: null,
            repositories: null,
            solFilesFromChosenRepo: null,
            chosenFileName: body.get("chosenFileName") as string,
            txDetails: null,
            error: null,
          };
        case "deployContract":
          try {
            if (!team.Repository) throw new Error("No filename found");
            await deployContract(
              ownerGithubInstallationId as string,
              team.Repository,
              team.ApiKey?.key as string
            );
          } catch (e: any) {
            if (e.message == "Not Found") {
              throw new Error(
                "`/out` directory not found. Build project and push build files to github to proceed."
              );
            } else {
              throw e;
            }
          }

          return {
            originCallForm: "deployContract",
            chosenRepoName: null,
            repositories: null,
            solFilesFromChosenRepo: null,
            chosenFileName: null,
            txDetails: null,
            error: null,
          };
        case "fundWallet":
          let currentBalance = body.get("currentBalance") as `${number}`;
          const adminClient = createTestClient({
            chain: fetherChainFromKey(associatedUser.ApiKey?.key as string),
            mode: "anvil",
            transport: http(),
          });
          const publicClient = createPublicClient({
            chain: fetherChainFromKey(associatedUser.ApiKey?.key as string),
            transport: http(),
          });

          let balance = await publicClient.getBalance({
            address: body.get("walletAddress") as `0x${string}`,
          });

          await adminClient.setBalance({
            address: body.get("walletAddress") as `0x${string}`,
            value: parseEther("1") + balance,
          });
          return {
            originCallForm: "fundWallet",
            chosenRepoName: null,
            repositories: null,
            solFilesFromChosenRepo: null,
            chosenFileName: null,
            txDetails: null,
            error: null,
          };
        case "setDeployerAddress":
          let newDeployerAddress = body.get("deployerAddress") as string;

          let valid = isAddress(newDeployerAddress);
          if (valid) {
            await db.repository.update({
              where: { userId: associatedUser.id },
              data: {
                deployerAddress: newDeployerAddress,
              },
            });
          }
          return {
            originCallForm: "setDeployerAddress",
            chosenRepoName: null,
            repositories: null,
            solFilesFromChosenRepo: null,
            chosenFileName: null,
            txDetails: null,
            error: null,
          };
        case "getTransaction":
          const txHash = body.get("txHash");
          const apiKey = body.get("apiKey");
          if (!txHash || !apiKey) {
            return {
              originCallForm: "getTransaction",
              chosenRepoName: null,
              repositories: null,
              solFilesFromChosenRepo: null,
              chosenFileName: null,
              txDetails: null,
              error: "null txHash or apiKey",
            };
          }
          let txDetails = await getTransactionDetails(txHash as `0x${string}`, apiKey as string);

          return {
            originCallForm: "getTransaction",
            chosenRepoName: null,
            repositories: null,
            solFilesFromChosenRepo: null,
            chosenFileName: null,
            txDetails: txDetails,
            error: null,
          };
        case "createTeam":
          const teamName = body.get("teamName");
          if (!teamName) {
            return {
              originCallForm: "createTeam",
              chosenRepoName: null,
              repositories: null,
              solFilesFromChosenRepo: null,
              chosenFileName: null,
              txDetails: null,
              error: "null teamName",
            };
          }
          const validTeamName = zodTeamName.safeParse(teamName);

          if (validTeamName.success == false) {
            return {
              originCallForm: "createTeam",
              chosenRepoName: null,
              repositories: null,
              solFilesFromChosenRepo: null,
              chosenFileName: null,
              txDetails: null,
              error: "Name can only contain alphanumeric, hyphen, underscore, and 3-20 characters.",
            };
          }
          if (associatedUser.memberTeamId) {
            return {
              originCallForm: "createTeam",
              chosenRepoName: null,
              repositories: null,
              solFilesFromChosenRepo: null,
              chosenFileName: null,
              txDetails: null,
              error: "User already has a team",
            };
          }
          let newTeam = await db.team.create({
            data: {
              name: teamName as string,
              ownerId: associatedUser.id,
            },
          });
          await db.user.update({
            where: { id: associatedUser.id },
            data: {
              memberTeamId: newTeam.id,
            },
          });
          return {
            originCallForm: "createTeam",
            chosenRepoName: null,
            repositories: null,
            solFilesFromChosenRepo: null,
            chosenFileName: null,
            txDetails: null,
            error: null,
          };
        default:
          return {
            originCallForm: "",
            chosenRepoName: null,
            repositories: null,
            solFilesFromChosenRepo: null,
            chosenFileName: null,
            txDetails: null,
            error: null,
          };
      }
    } catch (e: any) {
      if (e.message == "Not Found") {
        return {
          originCallForm: "",
          chosenRepoName: null,
          repositories: null,
          solFilesFromChosenRepo: null,
          chosenFileName: null,
          txDetails: null,
          error:
            "Could not find files, ensure you are using a compatible repository and your forge build files are present.",
        };
      } else {
        return {
          originCallForm: null,
          chosenRepoName: null,
          repositories: null,
          solFilesFromChosenRepo: null,
          chosenFileName: null,
          txDetails: null,
          error: e.message as string,
        };
      }
    }
  } else {
    return {
      originCallForm: "",
      chosenRepoName: null,
      repositories: null,
      solFilesFromChosenRepo: null,
      chosenFileName: null,
      txDetails: null,
      error: "user not found",
    };
  }
};
export const meta: V2_MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: "Fether | " + spacify(data?.teamData.name as string) }];
};
export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const actionArgs = useActionData<typeof action>();
  const navigation = useNavigation();
  const teamData = loaderData.teamData as unknown as TeamWithKeyRepoActivityMembers;

  const [setupStep, setSetupStep] = useState<number>(loaderData.setupStep);
  useEffect(() => {
    setSetupStep(loaderData.setupStep);
  }, [
    loaderData.teamData?.Repository?.filename,
    loaderData.teamData?.Repository?.repoName,
    loaderData.teamData?.Repository?.deployerAddress,
    loaderData.teamData?.ApiKey?.key,
  ]);
  return (
    <>
      {!(
        teamData &&
        teamData.Repository &&
        teamData.Repository.contractAddress &&
        teamData.Repository.contractAbi &&
        teamData.Repository.deployerAddress &&
        teamData.Repository.filename &&
        teamData.ApiKey &&
        teamData.ApiKey.key
      ) ? (
        <SetupWizard
          teamData={teamData}
          userData={null}
          navigation={navigation}
          actionArgs={actionArgs}
          dashboardType="team"
          step={setupStep}
          updateStep={(step: number) => setSetupStep(step)}
        />
      ) : (
        <Dashboard
          teamData={teamData}
          userData={null}
          navigation={navigation}
          actionArgs={actionArgs}
          dashboardType="team"
        />
      )}
    </>
  );
}
