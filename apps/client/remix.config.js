/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  future: {
    v2_routeConvention: true,
  },
  cacheDirectory: "./node_modules/.cache/remix",
  ignoredRouteFiles: ["**/.*"],
  server: process.env.NODE_ENV === "development" ? undefined : "./server.js",
  serverBuildPath: "api/index.js",
  serverDependenciesToBundle: [
    "database",
    /^@?connectkit.*/,
    /^@?wagmi.*/,
    "@rainbow-me/rainbowkit",
    /^@?rainbow-me.*/,
  ],
  tailwind: true,
};
