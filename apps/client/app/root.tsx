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
import { Navbar } from "~/components/Navbar";
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
    <html lang="en" className="bg-primary-gray min-h-screen w-screen overflow-x-hidden">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <div className="mx-auto ">
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

  if (error instanceof Error) {
    return (
      <html>
        <head>
          <title>Oh no!</title>
          <Meta />
          <Links />
        </head>
        <body>
          <Navbar hasAccess={false} isSignedIn={false} />
          <div className="h-screen w-screen flex flex-col justify-center align-middle items-center bg-primary-gray text-white font-primary">
            <h1>Uh oh ...</h1>
            <p>Something went wrong.</p>
            <pre>Error: {error.message}</pre>
            <Link
              to="/alpha/dashboard"
              className="mt-4 border border-off-white/25 text-off-white/25 px-4"
            >
              Back to dashboard
            </Link>
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
          <Navbar hasAccess={false} isSignedIn={false} />
          <div className="h-screen w-screen flex flex-col justify-center align-middle items-center bg-primary-gray text-white font-primary">
            <h1>Uh oh ...</h1>
            <p>Something went wrong.</p>
            <pre>Error: {JSON.stringify(error)}</pre>
            <Link
              to="/alpha/dashboard"
              className="mt-4 border border-off-white/25 text-off-white/25 px-4"
            >
              Back to dashboard
            </Link>
          </div>

          <Scripts />
        </body>
      </html>
    );
  }
}
