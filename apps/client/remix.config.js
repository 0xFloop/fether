/** @type {import('@remix-run/dev').AppConfig} */
const isDevelopment = process.env.NODE_ENV === "development";

module.exports = {
  future: {
    v2_routeConvention: true,
    v2_headers: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_errorBoundary: true,
  },
  cacheDirectory: "./node_modules/.cache/remix",
  ignoredRouteFiles: ["**/.*"],
  server: isDevelopment ? undefined : "./server.ts",
  serverBuildPath: "api/index.js",
  watchPaths: async () => {
    return ["../../packages/database/prisma/schema.prisma"];
  },
  serverDependenciesToBundle: [
    "database",
    /^@?connectkit.*/,
    /^@?wagmi.*/,
    "@rainbow-me/rainbowkit",
    /^@?rainbow-me.*/,
    "@rainbow-me/rainbowkit/wallets",
    /^@?wagmi.*/,
    /.*/,
  ],
  tailwind: true,
};
