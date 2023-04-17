import { createCookieSessionStorage } from "@remix-run/node";

type SessionData = {
  alphaKey: string;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } = createCookieSessionStorage<
  SessionData,
  SessionFlashData
>({
  cookie: {
    name: "__alphakeysession",
    httpOnly: true,
    sameSite: "lax",
    secrets: ["QOQ27fBvcGbE5Je8"],
    secure: true,
  },
});

export { getSession, commitSession, destroySession };
