import { LoaderArgs, redirect } from "@remix-run/node";
import { getSession, commitSession } from "../utils/alphaAccessKeySession";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
  destroySession as userDestroySession,
} from "../utils/alphaSession";

export const loader = async ({ request }: LoaderArgs) => {
  const session = await userGetSession(request.headers.get("Cookie"));
  return redirect("/", {
    headers: {
      "Set-Cookie": await userDestroySession(session),
    },
  });
};
