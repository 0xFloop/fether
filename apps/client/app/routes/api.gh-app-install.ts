import { ActionArgs, redirect } from "@vercel/remix";
import { db } from "~/utils/db.server";
import { hasGithubAppInstalled } from "~/utils/octo.server";
import { getSession as userGetSession } from "../utils/alphaSession.server";
export const action = async ({ request }: ActionArgs) => {
  const body = await request.formData();
  const username = body.get("username");
  if (!username) throw new Error("No username provided to install github app");

  let installId = await hasGithubAppInstalled(username as string);
  console.log(installId);
  if (installId) {
    const session = await userGetSession(request.headers.get("Cookie"));
    if (!session.has("userId")) {
      return redirect("/");
    }

    const userData = await db.user.findUnique({
      where: { id: session.get("userId") },
    });

    if (userData) {
      await db.user.update({
        where: { id: userData.id },
        data: { githubInstallationId: installId },
      });
      return redirect("/alpha/dashboard");
    } else {
      throw new Error("User not found");
    }
  } else {
    const fetherGithubAppInstallUrl = process.env.fetherGithubAppInstallUrl as string;
    return redirect(fetherGithubAppInstallUrl);
  }
};
