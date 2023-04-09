import { PrismaClient } from "database";

let db: PrismaClient;

declare global {
  var __db: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "production") {
  db = new PrismaClient();
} else {
  if (!global.__db) {
    global.__db = new PrismaClient({ log: ["error", "warn"] });
  }
  db = global.__db;
}

export { db };
