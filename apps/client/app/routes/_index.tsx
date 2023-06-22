import { ActionArgs, LoaderArgs, json, redirect } from "@vercel/remix";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import Typewriter from "typewriter-effect";
import { X } from "lucide-react";
import { AlphaKeyStatus } from "database";
import { db } from "../db.server";
import { getSession, commitSession } from "../utils/alphaAccessKeySession.server";
import {
  getSession as getUserSession,
  commitSession as commitUserSession,
} from "../utils/alphaSession.server";

export const loader = async ({ request }: LoaderArgs) => {
  //validate session cookie
  const session = await getSession(request.headers.get("Cookie"));
  const userSession = await getUserSession(request.headers.get("Cookie"));

  if (session.has("alphaKey") || userSession.has("userId")) {
    return json({ hasAccess: true });
  }
  return json({ hasAccess: false });
};

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const alphaAccessKey = formData.get("alphaAccessKey");
  if (!alphaAccessKey) return redirect("/");

  let alphaAccessStatus = await db.alphaAccessKeys.findUnique({
    where: { alphaKey: alphaAccessKey as string },
  });

  if (alphaAccessStatus) {
    if (alphaAccessStatus.keyStatus == AlphaKeyStatus.USED)
      return json({ message: `Key already used` });
    else {
      await db.alphaAccessKeys.update({
        where: { alphaKey: alphaAccessKey as string },
        data: { keyStatus: AlphaKeyStatus.USED },
      });

      const session = await getSession(request.headers.get("Cookie"));
      session.set("alphaKey", alphaAccessKey as string);
      console.log(session.get("alphaKey"));

      return redirect("/alpha", {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }
  } else {
    console.log("Invalid alpha key");
    return json({ message: `Invalid key` });
  }
}
export default function Index() {
  const [alphaPopup, setAlphaPopup] = useState<boolean>(false);
  const data = useActionData<typeof action>();
  const { hasAccess } = useLoaderData<typeof loader>();
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#f0f0f0]">
      <div className="m-auto relative flex flex-col justify-center items-center p-6 text-center w-full h-full">
        <div className="font-display flex flex-row absolute bottom-4 left-6 align-bottom items-baseline">
          <h1 className="text-[100px] leading-[80px] md:text-[150px] md:leading-[120px]">fether</h1>
          <p className="text-base md:text-2xl">by floop</p>
        </div>
        <div className="font-display flex flex-row absolute bottom-4 right-6 align-bottom items-baseline">
          {hasAccess && <Link to="/alpha">Access Alpha</Link>}
          {!hasAccess && !alphaPopup && (
            <button onClick={() => setAlphaPopup(true)}>Get Alpha Access</button>
          )}
        </div>
        {alphaPopup && (
          <div className="relative left-0 w-full flex flex-col h-full items-center align-middle justify-center">
            <div className="h-auto w-auto relative border-2 border-black rounded p-10">
              <X
                size={40}
                strokeWidth={1.25}
                strokeLinecap="square"
                className="absolute right-3 top-3"
                onClick={() => setAlphaPopup(false)}
              />
              <p className="font-sans text-2xl inline-block">Enter alpha key</p>
              <Form method="post" className="mt-10">
                <input type="text" name="alphaAccessKey" className="border-black rounded" />
                <button type="submit" className="font-sans text-base ml-4 inline-block">
                  Submit
                </button>
              </Form>

              {data && (
                <p className="font-sans text-red-500 text-base mt-4 inline-block">{data.message}</p>
              )}
            </div>
          </div>
        )}

        {!alphaPopup && (
          <p className="font-sans text-base md:text-2xl inline-block">
            <Typewriter
              options={{
                strings: [
                  "Enabling frictionless smart contract <—> frontend relationships.",
                  "Coming soon.",
                ],
                autoStart: true,
                delay: 40,
                loop: false,
                deleteSpeed: 10,
                //@ts-ignore
                pauseFor: 4000,
              }}
            />{" "}
          </p>
        )}
      </div>
    </div>
  );
}
