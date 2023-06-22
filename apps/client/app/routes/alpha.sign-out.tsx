import { LoaderArgs, redirect } from "@vercel/remix";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
  destroySession as userDestroySession,
} from "../utils/alphaSession.server";

export const loader = async ({ request }: LoaderArgs) => {
  const session = await userGetSession(request.headers.get("Cookie"));
  return redirect("/", {
    headers: {
      "Set-Cookie": await userDestroySession(session),
    },
  });
};
