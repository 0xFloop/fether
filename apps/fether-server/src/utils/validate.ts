import { ApiKey, Repository, User } from "database";
import { PrismaClient } from "database";
const db = new PrismaClient();
type ApiKeyWithUserWithRepo =
  | (ApiKey & {
      associatedUser: User & { Repository: Repository | null };
    })
  | null;
export async function validateSender(
  apiKey: string
): Promise<{ success: boolean; apiKeyData: ApiKeyWithUserWithRepo }> {
  try {
    console.log("apiKey from validate.ts: ", apiKey);
    let apiKeyData = await db.apiKey.findUnique({
      where: { key: apiKey },
      include: { associatedUser: { include: { Repository: true } } },
    });
    if (apiKeyData) {
      return { success: true, apiKeyData };
    } else {
      return { success: false, apiKeyData: null };
    }
  } catch (err) {
    throw err;
  }
}
