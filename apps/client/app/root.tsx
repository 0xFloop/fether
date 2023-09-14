import type { LinksFunction, V2_MetaFunction } from "@vercel/remix";
import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";

import stylesheet from "~/tailwind.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: "https://rsms.me/inter/inter.css" },
  { href: stylesheet, rel: "stylesheet" },
];

export const meta: V2_MetaFunction = () => {
  return [
    { title: "Fether" },
    { name: "description", content: "Enabling frictionless smart contract to frontend testing." },
    { name: "charset", content: "utf-8" },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
  ];
};

export default function App() {
  return (
    <html lang="en" className="h-full bg-primary-gray">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <div className="mx-auto min-h-screen">
          <Outlet />
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  // when true, this is what used to go to `CatchBoundary`
  // if (isRouteErrorResponse(error)) {
  //   return (
  //     <div className="h-80">
  //       <h1>Oops</h1>
  //       <p>Status: {error.status}</p>
  //       <p>{error.data.message}</p>
  //     </div>
  //   );
  // }

  // Don't forget to typecheck with your own logic.
  // Any value can be thrown, not just errors!
  if (error instanceof Error) {
    return (
      <html>
        <head>
          <title>Oh no!</title>
          <Meta />
          <Links />
        </head>
        <body>
          <div
            id="navbar"
            className="absolute w-full h-20 border-b text-white border-b-white flex flex-row justify-between items-center z-50 "
          >
            <Link to="/" id="logo" className="text-5xl flex-1 pl-8 font-primary">
              fether
            </Link>
            <div className="flex-1  pr-8">
              <a id="signout" href="/alpha/sign-out" className="float-right">
                signout
              </a>
            </div>
          </div>
          <div className="h-screen w-screen flex flex-col justify-center align-middle items-center bg-primary-gray text-white font-primary">
            <h1>Uh oh ...</h1>
            <p>Something went wrong.</p>
            <pre>Error: {error.message}</pre>
          </div>
          <Scripts />
        </body>
      </html>
    );
  } else {
    return (
      <html>
        <head>
          <title>Oh no!</title>
          <Meta />
          <Links />
        </head>
        <body>
          <div
            id="navbar"
            className="absolute w-full h-20 border-b text-white border-b-white flex flex-row justify-between items-center z-50 "
          >
            <Link to="/" id="logo" className="text-5xl flex-1 pl-8 font-primary">
              fether
            </Link>
            <div className="flex-1  pr-8">
              <a id="signout" href="/alpha/sign-out" className="float-right">
                signout
              </a>
            </div>
          </div>
          <div className="h-screen w-screen flex flex-col justify-center align-middle items-center bg-primary-gray text-white font-primary">
            <h1>Uh oh ...</h1>
            <p>Something went wrong.</p>
            <pre>Error: {JSON.stringify(error)}</pre>
          </div>
          <Scripts />
        </body>
      </html>
    );
  }
}
