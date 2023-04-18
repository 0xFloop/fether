import bcrypt from "bcryptjs";

import { db } from "../db.server";

type LoginForm = {
  username: string;
  password: string;
};

export async function validateCredentials({ username, password }: LoginForm) {
  let userData = await db.user.findUnique({ where: { username } });
  if (!userData) throw new Error("Invalid username or password");

  const isCorrectPassword = await bcrypt.compare(password, userData.passwordHash);

  if (!isCorrectPassword) {
    throw new Error("Invalid username or password");
  } else return userData;
}

export async function createUser({ username, password }: LoginForm) {
  const passwordHash = await bcrypt.hash(password, 10);
  let userData = db.user.create({
    data: {
      username,
      passwordHash: passwordHash,
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });
  return userData;
}
