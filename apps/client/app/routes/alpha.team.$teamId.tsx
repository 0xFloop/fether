import { ActionArgs, LoaderArgs, json, redirect } from "@vercel/remix";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { db } from "../utils/db.server";
import { getSession, commitSession } from "../utils/alphaAccessKeySession.server";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
} from "../utils/alphaSession.server";

export const loader = async ({ params, request }: LoaderArgs) => {
  const user = await userGetSession(request.headers.get("Cookie"));
  if (!user.has("userId")) throw redirect("/");
  const teamData = await db.team.findUnique({
    where: { id: params.teamId },
    include: { Members: true, Repository: true, InviteCodes: true },
  });
  if (!teamData) throw new Error("Team not found!");
  if (!teamData.Members.find((member) => member.id === user.get("userId"))) {
    throw new Error("You are not a member of this team! Contact the team owner to request access.");
  }
  const isOwner = teamData.ownerId === user.get("userId");
  type returnedMemberData = {
    username: string;
    isOwner: boolean;
  };

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
  return { returnedTeamData, isOwner };
};
export const action = async ({ request }: ActionArgs) => {};
export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  return <div className="">{loaderData.isOwner}</div>;
}
