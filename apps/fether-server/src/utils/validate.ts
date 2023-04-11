import { ApiKeys } from "database";
import { PrismaClient } from "database";
const db = new PrismaClient();

export async function validateSender(
  apiKey: string
): Promise<{ success: boolean; apiKeyData?: ApiKeys }> {
  try {
    let apiKeyData = await db.apiKeys.findUnique({ where: { key: apiKey } });
    if (apiKeyData) {
      return { success: true, apiKeyData };
    }
    return { success: false };
  } catch (err) {
    throw err;
  }
}
