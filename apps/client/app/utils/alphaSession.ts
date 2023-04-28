import { createCookieSessionStorage } from "@remix-run/node";

type SessionData = {
  userId: string;
};

type SessionFlashData = {
  error: string;
};

let cookieAgeInDays = 30;

const { getSession, commitSession, destroySession } = createCookieSessionStorage<
  SessionData,
  SessionFlashData
>({
  cookie: {
    name: "__session",
    httpOnly: true,
    sameSite: "lax",
    secrets: [process.env.alphaSessionSecret as string],
    secure: true,
    maxAge: 60 * 60 * 24 * cookieAgeInDays,
  },
});

export { getSession, commitSession, destroySession };
