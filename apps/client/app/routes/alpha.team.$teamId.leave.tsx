import { LoaderArgs, redirect } from "@remix-run/server-runtime";
import { getSession as userGetSession } from "../utils/alphaSession.server";
import { UserWithKeyRepoActivityTeam } from "~/types";
import { db } from "~/utils/db.server";

export const loader = async ({ params, request }: LoaderArgs) => {
  //load params
  let teamId = params.teamId;

  if (!teamId) throw Error("Must provide teamId.");

  //validate invite code
  let team = await db.team.findUnique({ where: { id: teamId }, include: { InviteCodes: true } });
  if (!team) throw Error("Team not found.");

  //validate session cookie
  const user = await userGetSession(request.headers.get("Cookie"));
  if (!user.has("userId")) throw Error("Must be logged in to join a team.");

  const userData = await db.user.findUnique({
    where: { id: user.get("userId") },
    include: {
      MemberTeam: true,
    },
  });
  if (!userData) throw Error("User not found.");
  if (userData.id == team.ownerId)
    throw Error("Owner cannot leave team, delete this team if you would like to join another.");
  if (!userData.MemberTeam) throw Error("User is not on a team.");
  if (userData.MemberTeam.id !== teamId) throw Error("User is not on this team.");

  //update team and user data
  await db.user.update({
    where: { id: user.get("userId") },
    data: {
      memberTeamId: null,
    },
  });

  return redirect(`/alpha/dashboard`);
};
