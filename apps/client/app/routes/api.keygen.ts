import { ActionArgs, redirect } from "@vercel/remix";
import { db } from "../utils/db.server";
import { KeyTier } from "database";

export const action = async ({ request }: ActionArgs) => {
  const body = await request.formData();
  const dashboardType = body.get("dashboardType");
  console.log(dashboardType);
  if (dashboardType == "personal") {
    const userId = body.get("id");
    if (!userId) {
      return redirect("/alpha/dashboard");
    } else {
      const userData = await db.user.findUnique({ where: { id: userId as string } });
      if (!userData) {
        return redirect("/alpha/dashboard");
      } else {
        await db.apiKey.create({
          data: {
            keyTier: KeyTier.FREE,
            userId: userData.id,
            expires: new Date(Date.now() + 60 * 60 * 24 * 30),
          },
        });

        return redirect("/alpha/dashboard");
      }
    }
  } else if (dashboardType == "team") {
    const teamId = body.get("id");
    if (!teamId) {
      return redirect("/alpha/dashboard");
    } else {
      const teamData = await db.team.findUnique({ where: { id: teamId as string } });
      if (!teamData) {
        return redirect("/alpha/dashboard");
      } else {
        await db.apiKey.create({
          data: {
            keyTier: KeyTier.FREE,
            teamId: teamData.id,
            expires: new Date(Date.now() + 60 * 60 * 24 * 30),
          },
        });

        return redirect("/alpha/team/" + teamId);
      }
    }
  } else {
    throw new Error("Invalid dashboard type");
  }
};
