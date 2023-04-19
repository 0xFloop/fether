import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import Typewriter from "typewriter-effect";
import { db } from "../db.server";
import { getSession, commitSession } from "../utils/alphaAccessKeySession";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
} from "../utils/alphaSession";

export const loader = async ({ request }: LoaderArgs) => {
  //validate session cookie
  const user = await userGetSession(request.headers.get("Cookie"));
  if (!user.has("userId")) throw redirect("/alpha/login");

  let userData = await db.user.findUnique({ where: { id: user.get("userId") } });

  console.log(userData);

  return userData;
};

export default function Index() {
  const data = useLoaderData();

  return (
    <div className="w-screen h-screen overflow-hidden display flex flex-col">
      <div
        id="navbar"
        className="h-20 border-b border-b-black flex flex-row justify-between px-8 items-center"
      >
        <h2 id="logo" className="text-5xl flex-1">
          fether
        </h2>
        <div id="nav-links" className="flex flex-row gap-32 flex-1">
          <a href="/alpha/dashboard">dashboard</a>
          <a href="/alpha/documentation">documentation</a>
          <a href="/alpha/contact">contact</a>
        </div>
        <div className="flex-1">
          <button id="signout" className="float-right">
            signout
          </button>
        </div>
      </div>
      <div id="content"></div>
    </div>
  );
}
