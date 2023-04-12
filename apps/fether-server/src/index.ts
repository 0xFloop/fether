import express from "express";
import { App as Octo } from "octokit";
import { Abi } from "abitype/zod";
import { validateSender } from "./utils/validate";
import {
  formattedGithubAppPk,
  port,
  zodContractBuildFileSchema,
  zodEthereumJsonRpcRequestSchema,
} from "./utils/config";
import { adminClient, publicClient, walletClient } from "./utils/viemClients";
import { PrismaClient } from "database";
const db = new PrismaClient();

const app = express();
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const cors = require("cors");
app.use(cors());
const octo = new Octo({ appId: "302483", privateKey: formattedGithubAppPk });

app.post("/rpc/:API_KEY", jsonParser, async (req, res) => {
  try {
    let reqbody = zodEthereumJsonRpcRequestSchema.parse(req.body);
    console.log(reqbody.method);
    let validated = await validateSender(req.params.API_KEY);

    if (!validated.success) {
      res.set("Access-Control-Allow-Origin", "*");
      let error = {
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Invalid Fether api key. Sign up here https://www.fether.xyz.",
        },
        id: "1",
      };

      res.status(500);
      res.json(error);
    } else {
      let response = await fetch("http://127.0.0.1:8545", {
        method: "POST",
        body: JSON.stringify(reqbody),
        headers: { "Content-Type": "application/json" },
      });

      let responseJson = await response.json();
      res.set("Access-Control-Allow-Origin", "*");
      res.send(responseJson);
    }
  } catch (err) {
    console.log("ERROR OCCURED: \n", err);
    res.sendStatus(500);
    res.end(err);
  }
});

app.post("/payload", jsonParser, async (req, res) => {
  try {
    const octokit = await octo.getInstallationOctokit(req.body.installation.id);
    //needs to plan for if there are multiple commits in a push with sol files changed
    let repoApiKeyData = await db.apiKeys.findUnique({
      where: { githubId: req.body.installation.id },
    });
    if (repoApiKeyData) {
      for (let i = 0; i < req.body.commits.length; i++) {
        for (let j = 0; j < req.body.commits[i].modified.length; j++)
          if (req.body.commits[i].modified[j].slice(-3) == "sol") {
            console.log(req.body.installation.id);
            let modifiedContractPath: string = req.body.commits[i].modified[j];
            console.log("modified contract path: ", modifiedContractPath);

            let pathArray = modifiedContractPath.split("/");

            let fileName = pathArray.pop();
            pathArray.pop();

            let byteCodePath =
              pathArray.join("/") + "/out/" + fileName + "/" + fileName?.split(".")[0] + ".json";

            let contentsReq = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
              owner: "0xfloop",
              repo: "fether",
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

            await db.apiKeys.update({
              where: { githubId: req.body.installation.id },
              data: { contractAddress: transaction["contractAddress"], contractAbi: dbAbi },
            });
          }
      }

      // res.send("POST REQ FROM GITHUB BELOW: \n" + JSON.stringify(req.body));
      //@ts-ignore
      res.send("yay");
    } else {
      console.log("no api key found for this repo: ", req.body.installation.id);
      res.sendStatus(500);
      res.send("No api key found for this repo, please sign up at https://www.fether.xyz.");
    }
  } catch (err) {
    console.log("ERROR OCCURED: \n", err);

    res.sendStatus(500);
    res.end(err);
  }
});

app.get("/fetherkit/:API_KEY", async (req, res) => {
  try {
    let validated = await validateSender(req.params.API_KEY);
    if (validated.success == false) {
      res.set("Access-Control-Allow-Origin", "*");
      let error = {
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Invalid Fether api key. Sign up here https://www.fether.xyz.",
        },
        id: "1",
      };

      res.status(500);
      res.json(error);
    } else {
      res.set("Access-Control-Allow-Origin", "*");
      res.json(validated.apiKeyData);
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
