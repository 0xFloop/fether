import { createCookieSessionStorage } from "@vercel/remix";

type SessionData = {
  inviteCode: string;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } = createCookieSessionStorage<
  SessionData,
  SessionFlashData
>({
  cookie: {
    name: "__inviteCodeSession",
    httpOnly: true,
    sameSite: "lax",
    secrets: [process.env.alphaKeySecret as string],
    secure: true,
  },
});

export { getSession, commitSession, destroySession };
