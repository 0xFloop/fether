import express from "express";
import { App as Octo } from "octokit";
import {
  createWalletClient,
  getAddress,
  getContractAddress,
  http,
  parseEther,
  parseUnits,
} from "viem";
import { Abi } from "abitype/zod";
import { validateSender } from "./utils/validate";
import {
  ContractBuildFileZod,
  fetherChain,
  formattedGithubAppPk,
  port,
  testAbi,
} from "./utils/config";
import { address, adminClient, publicClient, walletClient } from "./utils/viemClients";
import { PrismaClient } from "database";
const db = new PrismaClient();
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const app = express();
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const cors = require("cors");
app.use(cors());
const octo = new Octo({ appId: "302483", privateKey: formattedGithubAppPk });

app.post("/rpc/:API_KEY", jsonParser, async (req, res) => {
  console.log(req.body.method);
  let reqbody = req.body;

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
});

app.post("/payload", jsonParser, async (req, res) => {
  //@ts-ignore
  const octokit = await octo.getInstallationOctokit(req.body.installation.id);

  for (let i = 0; i < req.body.commits.length; i++) {
    for (let j = 0; j < req.body.commits[i].modified.length; j++)
      if (req.body.commits[i].modified[j].slice(-3) == "sol") {
        let modifiedContractPath: string = req.body.commits[i].modified[j];
        console.log("modified co ntract path: ", modifiedContractPath);

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
        let validatedJSON = ContractBuildFileZod.parse(fileJSON);

        let byteCode = validatedJSON.bytecode.object as `0x${string}`;
        let abi = Abi.parse(fileJSON.abi);

        const privateKey = generatePrivateKey();
        const randPkaccount = privateKeyToAccount(privateKey);
        const randAddress = randPkaccount.address;

        await adminClient.setBalance({
          address: randAddress,
          value: parseEther("1"),
        });

        let nonce = await publicClient.getTransactionCount({
          address: randAddress,
        });
        console.log("nonce: " + nonce);

        const newContractAddress = getContractAddress({
          from: address,
          nonce: parseUnits(`${0}`, 1),
        });

        console.log("new contract address: " + newContractAddress);

        await db.apiKeys.upsert({
          where: { githubId: req.body.installation.id },
          update: { contractAddress: newContractAddress },
          create: {
            key: "testKey",
            contractAddress: newContractAddress,
            keyTier: "FREE",
            githubId: req.body.installation.id,
            createdAt: "1970-01-01T00:00:00.000Z",
            updatedAt: "1970-01-01T00:00:00.000Z",
            expires: "1970-01-01T00:00:00.000Z",
          },
        });
        console.log("sending from this address: " + randAddress);
        // update their contract address in the db
        const walletClient2 = createWalletClient({
          account: randAddress,
          chain: fetherChain,
          transport: http(),
        });

        let txhash = await walletClient.deployContract({
          bytecode: byteCode,
          abi: abi,
        });
        await new Promise((r) => setTimeout(r, 10000));

        const transaction = await publicClient.getTransactionReceipt({
          hash: txhash,
        });
        console.log(transaction);
      }
  }

  // res.send("POST REQ FROM GITHUB BELOW: \n" + JSON.stringify(req.body));
  //@ts-ignore
  res.send("yay");
});

app.get("/fetherkit/:API_KEY", async (req, res) => {
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
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
