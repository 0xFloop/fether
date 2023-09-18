import { ActionArgs, LoaderArgs, V2_MetaFunction, json, redirect } from "@vercel/remix";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { db } from "../utils/db.server";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
} from "../utils/alphaSession.server";
import { Dashboard } from "~/components/Dashboard";
import { TeamWithKeyRepoActivityMembers, returnedMemberData } from "~/types";
import SetupWizard from "~/components/SetupWizard";
import { determineSetupStep, spacify } from "~/utils/helpers";
import { useEffect, useState } from "react";

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
  console.log(teamData);
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
  const teamId = body.get("teamId");

  const associatedTeam = await db.team.findUnique({
    where: { id: teamId as string },
    include: {
      ApiKey: true,
      InviteCodes: true,
      Members: true,
      Repository: {
        include: {
          Activity: true,
        },
      },
    },
  });
  console.log(associatedTeam);
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
    loaderData.teamData?.Repository?.name,
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
