import { LoaderArgs, redirect } from "@remix-run/server-runtime";
import { getSession as userGetSession } from "../utils/alphaSession.server";
import { UserWithKeyRepoActivityTeam } from "~/types";
import { db } from "~/utils/db.server";

export const loader = async ({ params, request }: LoaderArgs) => {
  //load params
  let teamId = params.teamId;
  let inviteCode = params.inviteCode;

  if (!teamId || !inviteCode) throw Error("Must provide teamId and inviteCode to join a team.");

  //validate invite code
  let team = await db.team.findUnique({ where: { id: teamId }, include: { InviteCodes: true } });
  if (!team) throw Error("Team not found.");
  let validInvite = team.InviteCodes.find((invite) => invite.inviteCode === inviteCode);
  if (!validInvite) throw Error("Invalid invite code.");
  if (validInvite.keyStatus == "USED") throw Error("Invite code has already been used.");

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
  if (userData.MemberTeam) {
    if (userData.MemberTeam.id == teamId) {
      throw redirect(`/alpha/team/${teamId}`);
    } else {
      throw Error("User is already on a team. Leave your current team before joining a new one.");
    }
  }

  //update team and user data
  await db.user.update({
    where: { id: user.get("userId") },
    data: {
      memberTeamId: teamId,
    },
  });
  await db.teamInviteCode.update({
    where: { inviteCode: validInvite.inviteCode },
    data: {
      keyStatus: "USED",
    },
  });

  return redirect(`/alpha/team/${teamId}`);
};
