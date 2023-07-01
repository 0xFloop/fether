import { ActionArgs, LoaderArgs } from "@vercel/remix";
import { db } from "../utils/db.server";
import { zodSingleJsonRpcCallSchema, zodArrayJsonRpcCallSchema, zodApiKey } from "../utils/config";
import { validateSender } from "~/utils/validate";
import { decodeFunctionData, keccak256, parseTransaction } from "viem";

export const action = async ({ request, params }: ActionArgs) => {
  let api_key = zodApiKey.parse(params.api_key);
  const reqBody = await request.json();
  try {
    let reqbodySingle;
    let reqbodyArray;
    let isSingleRequest = zodSingleJsonRpcCallSchema.safeParse(reqBody);
    if (isSingleRequest.success) {
      reqbodySingle = isSingleRequest.data;
    } else {
      let isArrayRequest = zodArrayJsonRpcCallSchema.safeParse(reqBody);

      if (!isArrayRequest.success) {
        return new Response(null, {
          status: 469,
          statusText: "Invalid JSON-RPC request",
          headers: { "Access-Control-Allow-Origin": "*" },
        });
      } else {
        console.log(isArrayRequest.data.length);
        reqbodyArray = isArrayRequest.data;
      }
    }

    let validated = await validateSender(api_key);
    if (!validated.success) {
      let error = {
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Invalid Fether api key. Sign up here https://www.fether.xyz.",
        },
        id: "1",
      };

      throw new Response(null, {
        status: 469,
        statusText: JSON.stringify(error),
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    } else {
      let rpcUrl = process.env.ANVIL_SERVER_IP as string;

      let response = await fetch(rpcUrl, {
        method: "POST",
        body: JSON.stringify(reqbodySingle || reqbodyArray),
        headers: { "Content-Type": "application/json" },
      });

      if (reqbodyArray) {
        for (let i = 0; i < reqbodyArray.length; i++) {
          if (reqbodyArray[i].method == "eth_sendRawTransaction") {
            console.log(reqbodyArray[i].method);
          }
        }
      } else if (reqbodySingle) {
        if (reqbodySingle.method == "eth_sendRawTransaction") {
          console.log(reqbodySingle);
          if (reqbodySingle?.params) {
            let abi = JSON.parse(
              validated.apiKeyData?.associatedUser.Repository?.contractAbi as string
            );
            let transaction = parseTransaction(reqbodySingle.params[0]);
            let hash = keccak256(reqbodySingle.params[0]);

            const { functionName } = decodeFunctionData({
              abi: abi,
              data: transaction.data ?? "0x0",
            });

            try {
              await db.transaction.create({
                data: {
                  txHash: hash,
                  repositoryId: validated.apiKeyData?.associatedUser.Repository?.id as string,
                  functionName: functionName,
                },
              });
            } catch (error) {
              console.log("error: ", error);
            }
          }
        }
      }
      let responseJson = await response.json();

      return new Response(JSON.stringify(responseJson), {
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.log("ERROR OCCURED: \n", err);
    return new Response(null, {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      statusText: JSON.stringify(err),
    });
  }
};

export const loader = async ({ request, params }: LoaderArgs) => {};
