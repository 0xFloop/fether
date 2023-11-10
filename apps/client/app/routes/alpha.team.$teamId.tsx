import { ActionArgs, LoaderArgs, V2_MetaFunction, json, redirect } from "@vercel/remix";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { db } from "../utils/db.server";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
} from "../utils/alphaSession.server";

import {
  RepoData,
  TeamWithKeyRepoActivityMembers,
  UserWithKeyRepoActivityTeam,
  returnedMemberData,
} from "~/types";
import SetupWizard from "~/components/SetupWizard";
import {
  determineSetupStep,
  fetherChainFromKey,
  getTransactionDetails,
  spacify,
} from "~/utils/helpers";
import { useEffect, useState } from "react";
import {
  chooseFileToTrack,
  getRepositoryBranches,
  getRootDirTeam,
  getSolFileNames,
  getUserRepositories,
} from "~/utils/octo.server";
import { deployContract } from "~/utils/viem.server";
import { createPublicClient, createTestClient, http, isAddress, parseEther } from "viem";
import { TeamDashboard } from "~/components/TeamDashboard";
import rainbowStylesUrl from "@rainbow-me/rainbowkit/styles.css";
import { BackgroundLines } from "~/components/BackgroundLines";
export function links() {
  return [{ rel: "stylesheet", href: rainbowStylesUrl }];
}
export const loader = async ({ params, request }: LoaderArgs) => {
  const user = await userGetSession(request.headers.get("Cookie"));
  if (!user.has("userId")) throw redirect("/");
  let userData: UserWithKeyRepoActivityTeam;
  const userId = user.get("userId");
  try {
    userData = await db.user.findUnique({
      where: { id: userId as string },
      include: {
        ApiKey: true,
        IssuedInviteCodes: true,
        MemberTeam: true,
        Repository: {
          include: {
            Activity: true,
          },
        },
      },
    });
  } catch (error) {
    console.error(error);
    throw Error("Error loading user data");
  }
  let teamData: TeamWithKeyRepoActivityMembers;
  try {
    teamData = await db.team.findUnique({
      where: { id: params.teamId },
      include: {
        ApiKey: true,
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
  } catch (error) {
    console.error(error);
    throw new Error("Error loading team data.");
  }

  if (!teamData) throw redirect("/alpha/dashboard");

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

  return { returnedTeamData, userData, isOwner, teamData, setupStep };
};
export const action = async ({ request }: ActionArgs) => {
  const body = await request.formData();

  const user = await userGetSession(request.headers.get("Cookie"));
  if (!user.has("userId"))
    return {
      originCallForm: null,
      chosenRepoName: null,
      repositories: null,
      branches: null,
      solFilesFromChosenRepo: null,
      chosenFileName: null,
      txDetails: null,
      error: "User not found.",
    };

  let userId = user.get("userId");

  const teamFromUser = await db.user.findUnique({
    where: { id: userId as string },
    include: {
      MemberTeam: {
        include: {
          Repository: { include: { Activity: true } },
          ApiKey: true,
          Members: true,
          InviteCodes: true,
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
            teamFromUser.githubInstallationId as string
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
            branches: null,
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
                branchName: null,
                contractAbi: null,
                contractAddress: null,
                filename: null,
                foundryRootDir: null,
              },
            });

            return {
              originCallForm: "chooseRepo",
              chosenRepoName: chosenRepoName,
              repositories: null,
              branches: null,
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
            branches: null,
            solFilesFromChosenRepo: null,
            chosenFileName: null,
            txDetails: null,
            error: null,
          };
        case "getBranchesOfChosenRepo":
          let branches = await getRepositoryBranches(
            team.Repository?.repoName as string,
            teamFromUser.githubInstallationId as string
          );

          return {
            originCallForm: "getBranchesOfChosenRepo",
            chosenRepoName: null,
            repositories: null,
            branches: branches,
            solFilesFromChosenRepo: null,
            chosenFileName: null,
            txDetails: null,
            error: null,
          };
        case "chooseBranch":
          let chosenBranch = body.get("chosenBranch");
          if (!chosenBranch) throw new Error("No branch chosen");

          await db.repository.update({
            where: { id: team.Repository?.id as string },
            data: {
              branchName: chosenBranch as string,
              contractAbi: null,
              contractAddress: null,
              filename: null,
              foundryRootDir: null,
            },
          });

          return {
            originCallForm: "chooseBranch",
            chosenRepoName: null,
            repositories: null,
            branches: null,
            solFilesFromChosenRepo: null,
            chosenFileName: null,
            txDetails: null,
            error: null,
          };
        case "getFilesOfChosenRepo":
          let foundryRootDir = team.Repository?.foundryRootDir;
          if (!foundryRootDir) {
            foundryRootDir = await getRootDirTeam(
              team.id,
              teamFromUser.githubInstallationId as string
            );
          }
          let fileNameArray: string[] = await getSolFileNames(
            teamFromUser.githubInstallationId as string,
            foundryRootDir as string
          );
          return {
            originCallForm: "getFilesOfChosenRepo",
            chosenRepoName: null,
            repositories: null,
            branches: null,
            solFilesFromChosenRepo: fileNameArray,
            chosenFileName: null,
            txDetails: null,
            error: null,
          };
        case "chooseFileToTrack":
          let fileName = body.get("chosenFileName") as string;
          if (!fileName) throw new Error("No file name provided");

          await chooseFileToTrack(
            teamFromUser.githubInstallationId as string,
            fileName,
            team.Repository
          );

          return {
            originCallForm: "chooseFileToTrack",
            chosenRepoName: null,
            repositories: null,
            branches: null,
            solFilesFromChosenRepo: null,
            chosenFileName: fileName,
            txDetails: null,
            error: null,
          };
        case "updateConstructorArgs":
          let numOfArgs = body.get("numOfArgs") as string;
          let args = [];

          for (let i = 0; i < parseInt(numOfArgs); i++) {
            let arg = body.get(`constructorArg-${i}`) as string;
            if (!arg) throw new Error("Error loading constructor arg.");
            args.push(arg);
          }

          await db.repository.update({
            where: { teamId: team.id },
            data: {
              cachedConstructorArgs: JSON.stringify(args),
            },
          });

          return {
            originCallForm: "updateConstructorArgs",
            chosenRepoName: null,
            repositories: null,
            branches: null,
            solFilesFromChosenRepo: null,
            chosenFileName: null,
            txDetails: null,
            error: null,
          };
        case "deployContract":
          try {
            if (!team.Repository) throw new Error("No filename found");
            let numOfArgs = body.get("numOfArgs") as string;
            let useCachedArgs = body.get("useCachedArgs") as string;

            let args = [];

            if (useCachedArgs == "on" && team.Repository.cachedConstructorArgs) {
              args = JSON.parse(team.Repository.cachedConstructorArgs);
            } else if (numOfArgs) {
              for (let i = 0; i < parseInt(numOfArgs); i++) {
                let arg = body.get(`constructorArg-${i}`) as string;
                if (!arg) throw new Error("Error loading constructor arg.");
                args.push(arg);
              }
            }

            if (!team.Repository.cachedConstructorArgs) {
              await db.repository.update({
                where: { teamId: team.id },
                data: {
                  cachedConstructorArgs: JSON.stringify(args),
                },
              });
            }

            await deployContract(
              teamFromUser.githubInstallationId as string,
              team.Repository,
              team.ApiKey?.key as string,
              teamFromUser.username,
              args
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
            branches: null,
            solFilesFromChosenRepo: null,
            chosenFileName: null,
            txDetails: null,
            error: null,
          };
        case "fundWallet":
          const adminClient = createTestClient({
            chain: fetherChainFromKey(team.ApiKey?.key as string),
            mode: "anvil",
            transport: http(),
          });
          const publicClient = createPublicClient({
            chain: fetherChainFromKey(team.ApiKey?.key as string),
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
            branches: null,
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
              where: { teamId: team.id },
              data: {
                deployerAddress: newDeployerAddress,
              },
            });
          }
          return {
            originCallForm: "setDeployerAddress",
            chosenRepoName: null,
            repositories: null,
            branches: null,
            solFilesFromChosenRepo: null,
            chosenFileName: null,
            txDetails: null,
            error: null,
          };
        case "deleteTeam":
          if (team.ownerId !== userId) throw new Error("You are not the owner of this team.");
          await db.team.delete({ where: { id: team.id } });
          return {
            originCallForm: "deleteTeam",
            chosenRepoName: null,
            repositories: null,
            branches: null,
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
              branches: null,
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
            branches: null,
            solFilesFromChosenRepo: null,
            chosenFileName: null,
            txDetails: txDetails,
            error: null,
          };
        default:
          return {
            originCallForm: "",
            chosenRepoName: null,
            repositories: null,
            branches: null,
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
          branches: null,
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
          branches: null,
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
      branches: null,
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
  const userData = loaderData.userData as UserWithKeyRepoActivityTeam;

  const [setupStep, setSetupStep] = useState<number>(loaderData.setupStep);
  useEffect(() => {
    setSetupStep(loaderData.setupStep);
  }, [loaderData.setupStep]);
  return (
    <div className="relative w-screen min-h-screen h-full overflow-x-hidden bg-[url('/images/staticGrainSmallerest.png')] font-primary">
      <BackgroundLines />
      {loaderData.setupStep == 7 ? (
        <TeamDashboard
          teamData={teamData}
          userData={userData}
          navigation={navigation}
          actionArgs={actionArgs}
          dashboardType="team"
        />
      ) : (
        <SetupWizard
          teamData={teamData}
          userData={userData}
          navigation={navigation}
          actionArgs={actionArgs}
          dashboardType="team"
          step={setupStep}
          updateStep={(step: number) => setSetupStep(step)}
        />
      )}
    </div>
  );
}
