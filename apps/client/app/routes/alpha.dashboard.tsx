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

  return userData;
};

export default function Index() {
  const data = useLoaderData();
  return <div className="w-screen h-screen overflow-hidden">{data.username}</div>;
}
