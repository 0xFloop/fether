import { ActionArgs, LoaderArgs, redirect } from "@remix-run/node";
import { db } from "../db.server";
import { KeyTier } from "database";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
} from "../utils/alphaSession";
import { useSubmit } from "@remix-run/react";

export const action = async ({ request }: ActionArgs) => {};

async function handleAuthentication(
  code: string
): Promise<{ githubUsername: string | null; githubId: string | null }> {
  let githubUsername: string | null = null;
  let githubId: string | null = null;
  const url = "https://github.com/login/oauth/access_token";
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: "1755f9594459f4e4030c",
      client_secret: "7054d91280bf03b0594900df18efb860b43d5909",
      code,
      redirect_uri: "http://localhost:3000/gh-callback",
    }),
  };
  await fetch(url, options)
    .then((response) => response.json())
    .then(async (data) => {
      const accessToken = data.access_token;
      await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          githubUsername = data.login;
          githubId = data.id;
          return { githubUsername, githubId };
          // handle the user data
        })
        .catch((error) => {
          // handle the error
        });
    })
    .catch((error) => {
      // handle the error
    });

  return { githubUsername, githubId };
}

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
