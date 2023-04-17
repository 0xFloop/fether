import { createCookieSessionStorage } from "@remix-run/node";

type SessionData = {
  username: string;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } = createCookieSessionStorage<
  SessionData,
  SessionFlashData
>({
  cookie: {
    name: "__session",
    httpOnly: true,
    sameSite: "lax",
    secrets: ["QOQ27fBvcGbE5Je8"],
    secure: true,
  },
});

export { getSession, commitSession, destroySession };
