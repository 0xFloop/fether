import express from "express";
import { App as Octo } from "octokit";
import { Abi } from "abitype/zod";
import { validateSender } from "./utils/validate";
import {
  formattedGithubAppPk,
  port,
  zodContractBuildFileSchema,
  zodSingleJsonRpcCallSchema,
  zodArrayJsonRpcCallSchema,
} from "./utils/config";
import { adminClient, publicClient, walletClient } from "./utils/viemClients";
import { PrismaClient } from "database";
import { type } from "os";
import { decodeFunctionData, keccak256, parseTransaction } from "viem";
const db = new PrismaClient();

const app = express();
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const cors = require("cors");
app.use(cors());
const octo = new Octo({ appId: "302483", privateKey: formattedGithubAppPk });

type traceType = {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: any[] | undefined;
};

app.post("/rpc/:API_KEY", jsonParser, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");

  try {
    let reqbodySingle;
    let reqbodyArray;
    let isSingleRequest = zodSingleJsonRpcCallSchema.safeParse(req.body);
    if (isSingleRequest.success) {
      reqbodySingle = isSingleRequest.data;
    } else {
      let isArrayRequest = zodArrayJsonRpcCallSchema.safeParse(req.body);
      if (!isArrayRequest.success) {
        return res.status(469).json({ message: "Invalid JSON-RPC request" });
      } else {
        console.log(isArrayRequest.data.length);
        reqbodyArray = isArrayRequest.data;
      }
    }

    let validated = await validateSender(req.params.API_KEY);
    if (!validated.success) {
      let error = {
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Invalid Fether api key. Sign up here https://www.fether.xyz.",
        },
        id: "1",
      };

      return res
        .setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate")
        .status(469)
        .json(error);
    } else {
      let rpcUrl =
        process.env.NODE_ENV == "production"
          ? "https://fether-server.vercel.app"
          : "http://127.0.0.1:8545";

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

      // let txHash = await walletClient.sendTransaction({
      //   bytecode: byteCode,
      //   abi: abi,
      // });

      let responseJson = await response.json();
      res.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate").send(responseJson);
    }
  } catch (err) {
    console.log("ERROR OCCURED: \n", err);
    res.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate").status(500).end(err);
  }
});

app.post("/payload", jsonParser, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");

  try {
    let installId = req.body.installation.id.toString();

    const octokit = await octo.getInstallationOctokit(installId);

    let associatedUserData = await db.user.findUnique({
      where: { githubInstallationId: installId },
      include: { ApiKey: true, Repository: true },
    });

    if (
      associatedUserData &&
      associatedUserData.ApiKey &&
      associatedUserData.Repository &&
      associatedUserData.Repository.id == req.body.repository.id
    ) {
      for (let i = 0; i < req.body.commits.length; i++) {
        for (let j = 0; j < req.body.commits[i].modified.length; j++)
          if (req.body.commits[i].modified[j].slice(-3) == "sol") {
            let modifiedContractPath: string = req.body.commits[i].modified[j];
            console.log("modified contract path: ", modifiedContractPath);

            let pathArray = modifiedContractPath.split("/");
            console.log("pathArray: ", pathArray);

            let fileName = pathArray.pop();

            if (associatedUserData.Repository.filename == fileName) {
              let rootDir = associatedUserData.Repository.foundryRootDir;
              let fileName = associatedUserData.Repository.filename;

              let userName = associatedUserData.Repository.name.split("/")[0];
              let repoName = associatedUserData.Repository.name.split("/")[1];

              let byteCodePath =
                rootDir + "/out/" + fileName + "/" + fileName?.split(".")[0] + ".json";

              let contentsReq = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
                owner: userName,
                repo: repoName,
                path: byteCodePath,
                headers: {
                  "X-GitHub-Api-Version": "2022-11-28",
                  Accept: "application/vnd.github.raw",
                },
              });

              let fileJSON = JSON.parse(contentsReq.data.toString());
              let validatedJSON = zodContractBuildFileSchema.parse(fileJSON);

              let byteCode = validatedJSON.bytecode.object as `0x${string}`;
              let abi = Abi.parse(fileJSON.abi);
              let dbAbi = JSON.stringify(fileJSON.abi);

              let deployHash = await walletClient.deployContract({
                bytecode: byteCode,
                abi: abi,
              });

              await new Promise((r) => setTimeout(r, 5500));

              const transaction = await publicClient.getTransactionReceipt({
                hash: deployHash,
              });

              await db.transaction.create({
                data: {
                  txHash: deployHash,
                  repositoryId: associatedUserData.Repository.id,
                  functionName: "GitHub Deployment",
                },
              });

              await db.repository.update({
                where: { id: associatedUserData.Repository.id },
                data: {
                  contractAddress: transaction["contractAddress"],
                  contractAbi: dbAbi,
                  updatedAt: new Date(),
                },
              });
            }
          }
      }
      res.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate").send("yay");
    } else {
      console.log("no api key found for this repo: ", req.body.installation.id);
      res.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate").status(500);
      res.end("No api key found for this repo, please sign up at https://www.fether.xyz.");
    }
  } catch (err) {
    console.log("ERROR OCCURED: \n", err);

    res.sendStatus(500);
    res.end(err);
  }
});

app.get("/fetherkit/:API_KEY", async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  try {
    let validated = await validateSender(req.params.API_KEY);
    if (!validated.success) {
      res.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate");
      let error = {
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "FetherKit: Invalid Fether api key. Sign up here https://www.fether.xyz.",
        },
        id: "1",
      };

      res.status(500);
      res.json(error);
    } else {
      res.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate");
      res.json(validated.apiKeyData?.associatedUser.Repository);
    }
  } catch (err) {
    console.log("ERROR OCCURED: \n", err);

    res.sendStatus(500);
    res.end(err);
  }
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
