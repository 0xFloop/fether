export async function validateSender(apiKey: string): Promise<boolean> {
  if (apiKey !== "123456") {
    return false;
  }
  return true;
}
