import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import Typewriter from "typewriter-effect";
import { db } from "../db.server";
import { getSession, commitSession } from "../utils/alphaAccessKeySession";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
} from "../utils/alphaSession";

export const loader = async ({ request }: LoaderArgs) => {
  //validate session cookie
  const session = await getSession(request.headers.get("Cookie"));
  const user = await userGetSession(request.headers.get("Cookie"));
  return null;
};

export default function Index() {
  return <div className="w-screen h-screen overflow-hidden">hello you have a userid userid</div>;
}
