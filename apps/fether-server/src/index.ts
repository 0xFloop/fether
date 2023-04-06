import express from "express";
import { App as Octo } from "octokit";
import * as dotenv from "dotenv";
import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  getContractAddress,
  http,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import { z } from "zod";
import { validateSender } from "./utils/validate";
import {
  ContractBuildFileZod,
  fetherChain,
  formattedGithubAppPk,
  port,
  testAbi,
} from "./utils/config";
const cors = require("cors");
const app = express();
app.use(cors());
dotenv.config();

var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();

const octo = new Octo({ appId: "302483", privateKey: formattedGithubAppPk });

const pkaccount = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
);
const address = pkaccount.address;

const client = createWalletClient({
  account: address,
  chain: fetherChain,
  transport: http(),
});

const testClient = createTestClient({
  chain: foundry,
  mode: "anvil",
  transport: http(),
});

app.post("/rpc/:API_KEY", jsonParser, async (req, res) => {
  let validated = await validateSender(req.params.API_KEY);
  console.log("rpc call");
  console.log(req.body);
  if (!validated) {
    res.status(500).end("Invalid api key!");
  }
  let response = await fetch("http://127.0.0.1:8545", {
    method: "POST",
    body: JSON.stringify(req.body),
    headers: { "Content-Type": "application/json" },
  });

  let responseJson = await response.json();
  res.set("Access-Control-Allow-Origin", "*");
  res.send(responseJson);
});

app.post("/payload", jsonParser, async (req, res) => {
  //@ts-ignore
  const octokit = await octo.getInstallationOctokit(req.body.installation.id);

  await testClient.setStorageAt({
    address: "0xe846c6fcf817734ca4527b28ccb4aea2b6663c79",
    index: 1,
    value: "0x0000000000000000000000000000000000000000000000000000000000000069",
  });

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

        let byteCode = validatedJSON.deployedBytecode.object as `0x${string}`;
        let byteCode_ = validatedJSON.bytecode.object as `0x${string}`;
        console.log("deployedBytecode: ", byteCode);
        console.log("bytecode: ", byteCode_);

        let setCode = await testClient.setCode({
          address: "0xe846c6fcf817734ca4527b28ccb4aea2b6663c79",
          bytecode: byteCode_,
        });

        await testClient.setNonce({
          address,
          nonce: 100,
        });

        let contractAddress = getContractAddress({
          from: address,
          nonce: 100n,
        });

        console.log(contractAddress);

        let deployTx = await client.deployContract({
          bytecode: byteCode_,
          abi: testAbi,
        });
        console.log(deployTx);
      }
  }

  // res.send("POST REQ FROM GITHUB BELOW: \n" + JSON.stringify(req.body));
  //@ts-ignore
  res.send("yay");
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
