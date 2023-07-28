import { LoaderArgs } from "@vercel/remix";
import { zodApiKey } from "~/utils/config";
import { validateSender } from "~/utils/validate";

export const loader = async ({ request, params }: LoaderArgs) => {
  try {
    let api_key = zodApiKey.parse(params.api_key);

    let validated = await validateSender(api_key);
    if (!validated.success) {
      let error = {
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "FetherKit: Invalid Fether api key. Sign up here https://www.fether.xyz.",
        },
        id: "1",
      };

      throw new Response(JSON.stringify(error), {
        status: 500,
        statusText: JSON.stringify(error),
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    } else {
      return new Response(JSON.stringify(validated.apiKeyData?.associatedUser.Repository), {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }
  } catch (err) {
    console.log("ERROR OCCURED: \n", err);
    throw new Response(JSON.stringify(err), {
      status: 500,
      statusText: JSON.stringify(err),
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
};
