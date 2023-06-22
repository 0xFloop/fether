import { ActionArgs, redirect } from "@vercel/remix";
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
      await db.apiKey.create({
        data: {
          keyTier: KeyTier.FREE,
          userId: userData.id,
          expires: new Date(Date.now() + 60 * 60 * 24 * 30),
        },
      });

      return redirect("/alpha/dashboard");
    }
  }
};
