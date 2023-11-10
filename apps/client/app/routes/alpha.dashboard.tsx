import { ActionArgs, LoaderArgs, V2_MetaFunction, redirect } from "@vercel/remix";
import { useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { db } from "../utils/db.server";
import { getSession as userGetSession } from "../utils/alphaSession.server";
import {
  getRootDir,
  getSolFileNames,
  getUserRepositories,
  chooseFileToTrack,
  getRepositoryBranches,
} from "../utils/octo.server";

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
import { BackgroundLines } from "~/components/BackgroundLines";

export const meta: V2_MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: ("Fether | " + data?.userData?.username) as string }];
};
export const action = async ({ request }: ActionArgs): Promise<DashboardActionReturn> => {
  const body = await request.formData();

  const user = await userGetSession(request.headers.get("Cookie"));
  if (!user.has("userId")) throw Error("invalid call");
  let associatedUser: UserWithKeyRepoActivityTeam;
  const userId = user.get("userId");
  try {
    associatedUser = await db.user.findUnique({
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

  if (associatedUser) {
    try {
      const formType = body.get("formType");
      switch (formType) {
        case "getAllRepos":
          const repositories = await getUserRepositories(
            associatedUser.githubInstallationId as string
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
              where: { userId: associatedUser.id },
              create: {
                repoId: chosenRepoId as string,
                repoName: chosenRepoName as string,
                userId: associatedUser.id,
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
            associatedUser.Repository?.repoName as string,
            associatedUser.githubInstallationId as string
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
            where: { id: associatedUser.Repository?.id as string },
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
          let foundryRootDir = associatedUser.Repository?.foundryRootDir;
          if (!foundryRootDir) {
            foundryRootDir = await getRootDir(associatedUser.githubInstallationId as string);
          }

          let fileNameArray: string[] = await getSolFileNames(
            associatedUser.githubInstallationId as string,
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
            associatedUser.githubInstallationId as string,
            fileName,
            associatedUser.Repository
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
            where: { userId: associatedUser.id },
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
            let numOfArgs = body.get("numOfArgs") as string;
            let useCachedArgs = body.get("useCachedArgs") as string;

            let args = [];

            if (useCachedArgs == "on" && associatedUser?.Repository?.cachedConstructorArgs) {
              args = JSON.parse(associatedUser?.Repository?.cachedConstructorArgs);
            } else if (numOfArgs) {
              for (let i = 0; i < parseInt(numOfArgs); i++) {
                let arg = body.get(`constructorArg-${i}`) as string;
                if (!arg) throw new Error("Error loading constructor arg.");
                args.push(arg);
              }
            }

            if (!associatedUser?.Repository?.cachedConstructorArgs) {
              await db.repository.update({
                where: { userId: associatedUser.id },
                data: {
                  cachedConstructorArgs: JSON.stringify(args),
                },
              });
            }

            await deployContract(
              associatedUser.githubInstallationId as string,
              associatedUser.Repository,
              associatedUser.ApiKey?.key as string,
              associatedUser.username,
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
        case "createTeam":
          const teamName = body.get("teamName");
          if (!teamName) {
            return {
              originCallForm: "createTeam",
              chosenRepoName: null,
              repositories: null,
              branches: null,
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
              branches: null,
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
              branches: null,
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
            branches: null,
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

export const loader = async ({ request }: LoaderArgs) => {
  //validate session cookie
  const user = await userGetSession(request.headers.get("Cookie"));
  if (!user.has("userId")) throw redirect("/alpha/login");

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
    throw Error("Error loading user data");
  }
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
  }, [loaderData.setupStep]);

  return (
    <div className="relative w-screen min-h-screen h-full overflow-x-hidden bg-[url('/images/staticGrainSmallerest.png')] font-primary">
      <BackgroundLines />
      {loaderData.setupStep == 7 ? (
        <PersonalDashboard
          userData={userData}
          teamData={null}
          navigation={navigation}
          actionArgs={actionArgs}
          dashboardType="personal"
        />
      ) : (
        <SetupWizard
          teamData={null}
          userData={userData}
          navigation={navigation}
          actionArgs={actionArgs}
          dashboardType="personal"
          step={setupStep}
          updateStep={(step: number) => setSetupStep(step)}
        />
      )}
    </div>
  );
}
