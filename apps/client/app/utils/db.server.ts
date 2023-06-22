import { PrismaClient } from "database";
import { singleton } from "./singleton.server";

// Creates a singleton instance of PrismaClient
const db = singleton("db", () => new PrismaClient({ log: ["error", "warn"] }));
db.$connect();

export { db };
