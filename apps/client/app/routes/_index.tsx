import { ActionArgs, LoaderArgs, json, redirect } from "@vercel/remix";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import Typewriter from "typewriter-effect";
import { X } from "lucide-react";
import { KeyStatus } from "database";
import { db } from "../utils/db.server";
import { getSession, commitSession } from "../utils/alphaAccessKeySession.server";
import {
  getSession as getUserSession,
  commitSession as commitUserSession,
} from "../utils/alphaSession.server";
import { Navbar } from "~/components/Navbar";
import { Footer } from "~/components/Footer";

export const loader = async ({ request }: LoaderArgs) => {
  //validate session cookie
  const session = await getSession(request.headers.get("Cookie"));
  const userSession = await getUserSession(request.headers.get("Cookie"));
  let hasAccess = false;
  let isSignedIn = false;
  if (session.has("inviteCode")) {
    hasAccess = true;
  }
  if (userSession.has("userId")) {
    isSignedIn = true;
  }

  return json({ hasAccess, isSignedIn });
};

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const inviteCode = formData.get("inviteCode");
  if (!inviteCode) return redirect("/");

  let inviteCodeDetails = await db.inviteCode.findUnique({
    where: { inviteCode: inviteCode as string },
  });

  if (inviteCodeDetails) {
    if (inviteCodeDetails.keyStatus == KeyStatus.USED)
      return json({ message: `Code already used` });
    else {
      await db.inviteCode.update({
        where: { inviteCode: inviteCode as string },
        data: { keyStatus: KeyStatus.USED },
      });

      const session = await getSession(request.headers.get("Cookie"));
      session.set("inviteCode", inviteCode as string);

      return redirect("/alpha", {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }
  } else {
    return json({ message: `Invalid invite code` });
  }
}
export default function Index() {
  const [alphaPopup, setAlphaPopup] = useState<boolean>(false);
  const data = useActionData<typeof action>();
  const { hasAccess, isSignedIn } = useLoaderData<typeof loader>();
  return (
    <>
      <div className="w-screen min-h-screen overflow-x-hidden bg-[url('/images/staticGrainSmallerest.png')] font-primary">
        <div className="absolute -z-10 left-0 top-0 h-full w-full flex justify-center items-center">
          <div className=" h-full w-[95%] grid grid-cols-5">
            <div className="border-x border-x-off-white/25 h-full"></div>
            <div className="border-r border-r-off-white/25 h-full"></div>
            <div className="border-r border-r-off-white/25 h-full"></div>
            <div className="border-r border-r-off-white/25 h-full"></div>
            <div className="border-r border-r-off-white/25 h-full"></div>
          </div>
        </div>
        <Navbar hasAccess={hasAccess} isSignedIn={isSignedIn} />
        <div className="flex flex-col justify-center items-center w-full h-screen">
          <img
            src="/images/fetherWideLogo.svg"
            className="w-[486px] select-none bg-primary-gray bg-[url('/images/staticGrainSmallerest.png')] rounded-full"
            alt="Fether wide logo"
            draggable={false}
          />
          <h1 className="text-3xl select-none text-white mt-6">
            Enabling frictionless smart contract{" "}
            <span className="font-sans">
              {"<"}—{">"}
            </span>{" "}
            frontend testing
          </h1>
          <Form method="post" className="mt-10 bg-primary-gray">
            {hasAccess || isSignedIn ? (
              <>
                {isSignedIn ? (
                  <Link
                    to="alpha/dashboard"
                    className="border select-none bg-secondary-orange border-off-white/25 text-white py-4 px-14 text-xl text-center rounded-full"
                  >
                    Access Dashboard
                  </Link>
                ) : (
                  <Link
                    id="signin"
                    to="/alpha/login"
                    className="border select-none bg-secondary-orange border-off-white/25 text-white py-4 px-14 text-xl text-center rounded-full"
                  >
                    Log In
                  </Link>
                )}
              </>
            ) : (
              <input
                type="text"
                name="inviteCode"
                placeholder="Enter Invite Code"
                maxLength={8}
                className="border select-none bg-primary-gray bg-[url('/images/staticGrainSmallerest.png')] border-off-white/25 focus:ring-0 focus:border-secondary-orange text-3xl text-off-white/25 py-4 px-32 text-center"
              />
            )}
            <button type="submit" hidden></button>
          </Form>
          <p className="text-red-500 text-base mt-4">{data?.message}</p>
          <p className="text-white text-base mt-6 select-none">
            Need a code?{" "}
            <a
              href="https://twitter.com/messages/compose?recipient_id=1366965946548584448"
              target="_blank"
              className="underline"
            >
              Get Access
            </a>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
