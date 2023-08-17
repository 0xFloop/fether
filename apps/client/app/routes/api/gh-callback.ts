import { LoaderArgs, redirect } from "@vercel/remix";
import { db } from "../../utils/db.server";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
} from "../../utils/alphaSession.server";

async function handleAuthentication(
  code: string,
  redirectUri: string
): Promise<{ githubUsername: string | null; githubId: string | null }> {
  console.log(redirectUri);

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
      client_id: process.env.fetherGithubOAuthClientId as string,
      client_secret: process.env.fetherGithubOAuthClientSecret as string,
      code,
      redirect_uri: redirectUri,
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
  const redirectUri = process.env.fetherGithubRedirectUri as string;

  const url = new URL(request.url);
  let { githubUsername, githubId } = await handleAuthentication(
    url.searchParams.get("code") as string,
    redirectUri
  );

  const session = await userGetSession(request.headers.get("Cookie"));
  if (session.has("userId")) {
    return redirect("/alpha/dashboard");
  }

  //check if user exists based on githubId
  const userData = await db.user.findUnique({ where: { githubId: parseInt(githubId as string) } });
  if (userData) {
    session.set("userId", userData.id as string);

    // Login succeeded, send them to the home page.
    return redirect("/alpha/dashboard", {
      headers: {
        "Set-Cookie": await userCommitSession(session),
      },
    });
  } else {
    //create new user with this data
    console.log("creating new user");
    const newUser = await db.user.create({
      data: {
        githubId: parseInt(githubId as string),
        username: githubUsername as string,
      },
    });
    session.set("userId", newUser.id as string);
    return redirect("/alpha/dashboard", {
      headers: {
        "Set-Cookie": await userCommitSession(session),
      },
    });
  }
};
