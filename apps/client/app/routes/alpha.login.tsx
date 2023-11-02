import { ActionArgs, LoaderArgs, json, redirect } from "@vercel/remix";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { db } from "../utils/db.server";
import { getSession, commitSession } from "../utils/alphaAccessKeySession.server";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
} from "../utils/alphaSession.server";
import { BackgroundLines } from "~/components/BackgroundLines";
import { Loader } from "lucide-react";

export const loader = async ({ request }: LoaderArgs) => {
  let redirectUri = process.env.fetherGithubRedirectUri as string;
  const session = await getSession(request.headers.get("Cookie"));
  const user = await userGetSession(request.headers.get("Cookie"));
  if (!session.has("inviteCode")) throw redirect("/");
  if (user.has("userId")) throw redirect("/alpha/dashboard");
  else return redirectUri;
};
export const action = async ({ request }: ActionArgs) => {
  const clientId = process.env.fetherGithubOAuthClientId as string;
  const redirectUri = process.env.fetherGithubRedirectUri as string;
  const scope = "user:email";
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  return redirect(url);
};
export default function Index() {
  const navigation = useNavigation();

  return (
    <div className="relative text-white w-screen flex justify-center items-center min-h-screen h-full overflow-x-hidden bg-[url('/images/staticGrainSmallerest.png')] font-primary">
      <BackgroundLines />
      <div className="border z-60 relative border-off-white flex flex-col px-16 pb-12 rounded-xl bg-dark-gray">
        <span className="absolute w-full top-0 left-0 h-16 border-b border-b-off-white"></span>
        <div className="h-16 w-full flex items-center py-4 justify-center">
          <img src="/images/fetherLogoWhite.svg" className="h-9" />
          <h2 className="text-xs ml-2">
            BETA VERSION <span className="text-secondary-orange">0.0.03</span>
          </h2>
        </div>

        <h1 className="text-xl mt-10 text-white">
          Fether utilizes Log In With GitHub to streamline the GitHub
          <br />
          integration necessary for continuous contract tracking.
        </h1>
        <Form method="post">
          <div className="flex w-full justify-center mt-10">
            <button type="submit" className=" bg-secondary-orange py-3 px-20 rounded-full">
              {navigation.state == "submitting" ? (
                <div className="flex flex-row items-center">
                  <p>Logging In </p>
                  <div className="ml-2 animate-spin">
                    <Loader size={20} />
                  </div>
                </div>
              ) : (
                <p>Log in with GitHub</p>
              )}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
