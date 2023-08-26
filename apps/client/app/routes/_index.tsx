import { ActionArgs, LoaderArgs, json, redirect } from "@vercel/remix";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import Typewriter from "typewriter-effect";
import { X } from "lucide-react";
import { AlphaKeyStatus } from "database";
import { db } from "../utils/db.server";
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
    <div className="w-screen h-screen overflow-hidden text-white selection:bg-accent selection:text-primary-gray">
      <div className="m-auto relative flex flex-col justify-center items-center p-6 text-center w-full h-full">
        <div className="font-display flex flex-row absolute bottom-4 left-6 align-bottom items-baseline">
          <h1 className="text-[100px] leading-[80px] md:text-[150px] md:leading-[120px] font-primary">
            fether
          </h1>
        </div>
        <div className="font-primary text-lg flex flex-row absolute bottom-4 right-6 align-bottom items-baseline">
          {hasAccess && <Link to="/alpha">Access Alpha</Link>}
          {!hasAccess && !alphaPopup && (
            <button onClick={() => setAlphaPopup(true)}>Get Alpha Access</button>
          )}
        </div>
        {alphaPopup && (
          <div className="relative left-0 w-full flex flex-col h-full items-center align-middle justify-center">
            <div className="relative border-2 border-secondary-border bg-secondary-gray rounded p-10">
              <X
                size={24}
                strokeWidth={1.25}
                strokeLinecap="square"
                className="absolute right-3 top-3"
                onClick={() => setAlphaPopup(false)}
              />
              <p className="font-sans text-2xl inline-block">Enter alpha key</p>
              <Form
                method="post"
                className="mt-10 rounded-lg overflow-hidden flex flex-row justify-between items-center bg-almost-black"
              >
                <input type="text" name="alphaAccessKey" className=" text-black" />
                <button type="submit" className="font-primary px-2 text-base bg-almost-black">
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
          <p className="font-primary text-base md:text-2xl inline-block">
            <Typewriter
              options={{
                strings: [
                  "Enabling frictionless smart contract <—> frontend testing.",
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
