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
