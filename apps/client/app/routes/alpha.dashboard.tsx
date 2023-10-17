import { ActionArgs, LoaderArgs, V2_MetaFunction, redirect } from "@vercel/remix";
import { useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { db } from "../utils/db.server";
import { getSession as userGetSession } from "../utils/alphaSession.server";
import { getRootDir, getSolFileNames, getUserRepositories } from "../utils/octo.server";

import { deployContract } from "~/utils/viem.server";
import { useEffect, useState } from "react";
import {
  fetherChainFromKey,
  determineSetupStep,
  getTransactionDetails,
  zodTeamName,
  makeId,
} from "~/utils/helpers";
import { DashboardActionReturn, RepoData, UserWithKeyRepoActivityTeam } from "~/types";
import rainbowStylesUrl from "@rainbow-me/rainbowkit/styles.css";
export function links() {
  return [{ rel: "stylesheet", href: rainbowStylesUrl }];
}
import { createTestClient, http, parseEther, isAddress, createPublicClient } from "viem";
import SetupWizard from "~/components/SetupWizard";
import { PersonalDashboard } from "~/components/PersonalDashboard";

export const meta: V2_MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: ("Fether | " + data?.userData?.username) as string }];
};
export const action = async ({ request }: ActionArgs): Promise<DashboardActionReturn> => {
  const body = await request.formData();
  const githubInstallationId = body.get("githubInstallationId");
  const associatedUser = await db.user.findUnique({
    where: { githubInstallationId: githubInstallationId as string },
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

  if (associatedUser) {
    try {
      const formType = body.get("formType");
      switch (formType) {
        case "getAllRepos":
          const repositories = await getUserRepositories(githubInstallationId as string);
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
            console.log(chosenRepoData);
            const chosenRepoName = chosenRepoData.toString().split(",")[0];
            const chosenRepoId = chosenRepoData.toString().split(",")[1];

            await db.repository.upsert({
              where: { userId: associatedUser.id },
              create: {
                repoId: chosenRepoId as string,
                repoName: chosenRepoName as string,
                userId: associatedUser.id,
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
          let foundryRootDir = associatedUser.Repository?.foundryRootDir;
          if (!foundryRootDir) {
            foundryRootDir = await getRootDir(githubInstallationId as string);
          }
          let fileNameArray: string[] = await getSolFileNames(
            githubInstallationId as string,
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
            where: { userId: associatedUser.id },
            data: {
              filename: body.get("chosenFileName") ? (body.get("chosenFileName") as string) : null,
              contractAbi: null,
              contractAddress: null,
              deployerAddress: null,
            },
          });
          await db.transaction.deleteMany({
            where: { repositoryId: associatedUser.Repository?.id as string },
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
            await deployContract(
              githubInstallationId as string,
              associatedUser.Repository,
              associatedUser.ApiKey?.key as string,
              associatedUser.username
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
          await db.teamInviteCode.createMany({
            data: [
              { inviteCode: makeId(7), teamId: newTeam.id },
              { inviteCode: makeId(7), teamId: newTeam.id },
              { inviteCode: makeId(7), teamId: newTeam.id },
            ],
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

export const loader = async ({ request }: LoaderArgs) => {
  //validate session cookie
  const user = await userGetSession(request.headers.get("Cookie"));
  if (!user.has("userId")) throw redirect("/alpha/login");

  const userData: UserWithKeyRepoActivityTeam = await db.user.findUnique({
    where: { id: user.get("userId") },
    include: {
      ApiKey: true,
      IssuedInviteCodes: true,
      MemberTeam: true,
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
  let setupStep = determineSetupStep(userData, null);

  return { userData, setupStep };
};

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const actionArgs = useActionData<typeof action>();
  const navigation = useNavigation();
  const userData = loaderData.userData as UserWithKeyRepoActivityTeam;
  const [setupStep, setSetupStep] = useState<number>(loaderData.setupStep);

  useEffect(() => {
    setSetupStep(loaderData.setupStep);
  }, [
    loaderData.userData?.memberTeamId,
    loaderData.userData?.githubInstallationId,
    loaderData.userData?.Repository?.filename,
    loaderData.userData?.Repository?.repoName,
    loaderData.userData?.Repository?.deployerAddress,
    loaderData.userData?.ApiKey?.key,
  ]);
  return (
    <>
      {!(
        userData &&
        userData.Repository &&
        userData.Repository.contractAddress &&
        userData.Repository.contractAbi &&
        userData.Repository.deployerAddress &&
        userData.Repository.filename &&
        userData.ApiKey &&
        userData.ApiKey.key
      ) ? (
        <SetupWizard
          teamData={null}
          userData={userData}
          navigation={navigation}
          actionArgs={actionArgs}
          dashboardType="personal"
          step={setupStep}
          updateStep={(step: number) => setSetupStep(step)}
        />
      ) : (
        <PersonalDashboard
          userData={userData}
          teamData={null}
          navigation={navigation}
          actionArgs={actionArgs}
          dashboardType="personal"
        />
      )}
    </>
  );
}
