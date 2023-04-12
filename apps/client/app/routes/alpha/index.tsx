import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import Typewriter from "typewriter-effect";
import { db } from "../../db.server";
import { getSession, commitSession } from "../alphaAccessKeySession";

export const loader = async ({ request }: LoaderArgs) => {
  //validate session cookie
  const session = await getSession(request.headers.get("Cookie"));

  if (session.has("alphaKey")) {
    return "success";
  }
  return redirect("/");
};

export default function Index() {
  return <div className="w-screen h-screen overflow-hidden">hello</div>;
}
