import { LoaderArgs, redirect } from "@remix-run/node";
import { db } from "../db.server";
import { getSession as userGetSession } from "../utils/alphaSession";

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  let installationId = url.searchParams.get("installation_id");

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
      data: { githubInstallationId: installationId },
    });
    return redirect("/alpha/dashboard");
  } else {
    throw new Error("User not found");
  }
};
