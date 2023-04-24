import { ActionArgs, redirect } from "@remix-run/node";
import { db } from "../db.server";
import { KeyTier } from "database";

export const action = async ({ request }: ActionArgs) => {
  const body = await request.formData();
  const userId = body.get("userId");
  console.log("USERID IS CONSOLE LOGGED BELOW");
  console.log(userId);
  if (!userId) {
    return redirect("/alpha/dashboard");
  } else {
    const userData = await db.user.findUnique({ where: { id: userId as string } });
    if (!userData) {
      return redirect("/alpha/dashboard");
    } else {
      const newKey = await db.apiKeys.create({
        data: {
          keyTier: KeyTier.FREE,
          expires: new Date(Date.now() + 60 * 60 * 24 * 30),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      const updateUser = await db.user.update({
        where: { id: userId as string },
        data: { apiKey: newKey.key },
      });
      return redirect("/alpha/dashboard");
    }
  }
};
