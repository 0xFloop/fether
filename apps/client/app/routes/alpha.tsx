import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node";
import { Form, Link, Outlet, useActionData } from "@remix-run/react";
import { db } from "../db.server";
import { getSession, commitSession } from "../utils/alphaAccessKeySession";
import {
  getSession as userGetSession,
  commitSession as userCommitSession,
} from "../utils/alphaSession";

export const loader = async ({ request, params }: LoaderArgs) => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = await userGetSession(request.headers.get("Cookie"));
  const url = new URL(request.url);
  if (url.pathname === "/alpha" || url.pathname === "/alpha/") {
    if (user.has("username")) throw redirect("/alpha/dashboard");
    else if (session.has("alphaKey")) throw redirect("/alpha/login");
    else throw redirect("/");
  }
  return "success";
};

export default function Index() {
  return (
    <>
      <Outlet />
    </>
  );
}
