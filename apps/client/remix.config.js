/** @type {import('@remix-run/dev').AppConfig} */

const isDevelopment = process.env.NODE_ENV === "development";

module.exports = {
  ignoredRouteFiles: ["**/.*"],
  cacheDirectory: "./node_modules/.cache/remix",
  server: isDevelopment ? undefined : "./server.ts",
  serverBuildPath: "api/index.js",
  serverBuildTarget: "vercel",
  serverDependenciesToBundle: [
    "database",
    /^@?connectkit.*/,
    /^@?wagmi.*/,
    /^@?rainbow-me.*/,
    "@rainbow-me/rainbowkit",
    "@rainbow-me/rainbowkit/wallets",
    "wagmi",
    "@wagmi/core",
  ],
  watchPaths: async () => {
    return ["../../packages/database/prisma/schema.prisma"];
  },
  tailwind: true,
  future: {
    v2_errorBoundary: true,
    v2_routeConvention: true,
    v2_meta: true,
    v2_dev: true,
    v2_headers: true,
    v2_normalizeFormMethod: true,
  },
  tailwind: true,
};
