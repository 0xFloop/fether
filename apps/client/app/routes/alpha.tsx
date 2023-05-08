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
    if (user.has("userId")) throw redirect("/alpha/dashboard");
    else if (session.has("alphaKey")) throw redirect("/alpha/login");
    else throw redirect("/");
  }
  return "success";
};

export default function Index() {
  return (
    <div className="relative pb-80 min-h-screen">
      <div
        id="navbar"
        className="h-20 border-b border-b-black flex flex-row justify-between items-center"
      >
        <Link to="/" id="logo" className="text-5xl flex-1 pl-8 ">
          fether
        </Link>
        <div id="nav-links" className="flex flex-row justify-between gap-3 flex-1">
          <a href="/alpha/dashboard">dashboard</a>
          <a href="https://docs.fether.xyz" target="_blank">
            documentation
          </a>
          <a href="/alpha/contact">contact</a>
        </div>
        <div className="flex-1  pr-8">
          <a id="signout" href="/alpha/sign-out" className="float-right">
            signout
          </a>
        </div>
      </div>
      <Outlet />
      <div className="h-80 absolute bottom-0 w-screen bg-black"></div>
    </div>
  );
}
