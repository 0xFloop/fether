import { ActionArgs, LoaderArgs, redirect } from "@remix-run/node";
import { db } from "../db.server";
import { KeyTier } from "database";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
} from "../utils/alphaSession";
import { useSubmit } from "@remix-run/react";

export const action = async ({ request }: ActionArgs) => {};

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  let installationId = url.searchParams.get("installation_id");

  const session = await userGetSession(request.headers.get("Cookie"));
  if (!session.has("userId")) {
    return redirect("/");
  }

  const userData = await db.user.findUnique({ where: { id: session.get("userId") } });
  if (userData) {
    await db.user.update({
      where: { id: userData.id },
      data: { githubInstallationId: installationId },
    });

    // installation success, send them to the dashboard page.
    return redirect("/alpha/dashboard");
  } else {
    throw new Error("User not found");
  }
};
