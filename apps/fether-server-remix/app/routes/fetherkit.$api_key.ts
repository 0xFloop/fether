import { LoaderArgs } from "@vercel/remix";
import { zodApiKey } from "~/utils/config";
import { validateSender } from "~/utils/validate";

export const loader = async ({ request, params }: LoaderArgs) => {
  try {
    let api_key = zodApiKey.parse(params.api_key);

    let validated = await validateSender(api_key);
    if (!validated.success) {
      throw new Error(
        JSON.stringify("FetherKit: Invalid Fether api key. Sign up here https://www.fether.xyz.")
      );
    } else {
      return new Response(JSON.stringify(validated.apiKeyData?.associatedUser.Repository), {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
          Allow: "GET",
          "Access-Control-Allow-Headers": "Origin, Content-Type",
          "Access-Control-Allow-Methods": "GET",
        },
      });
    }
  } catch (err) {
    throw new Error(JSON.stringify(err));
  }
};
