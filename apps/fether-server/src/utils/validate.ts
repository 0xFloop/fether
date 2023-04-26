import { ApiKey } from "database";
import { PrismaClient } from "database";
const db = new PrismaClient();

export async function validateSender(
  apiKey: string
): Promise<{ success: boolean; apiKeyData?: ApiKey }> {
  try {
    let apiKeyData = await db.apiKey.findUnique({ where: { key: apiKey } });
    if (apiKeyData) {
      return { success: true, apiKeyData };
    }
    return { success: false };
  } catch (err) {
    throw err;
  }
}
