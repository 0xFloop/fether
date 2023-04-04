import express from "express";
import { App as Octo } from "octokit";
import * as dotenv from "dotenv";
import { createPublicClient, createTestClient, http, parseEther } from "viem";
import { foundry } from "viem/chains";
import { z } from "zod";
import { validateSender } from "./utils/validate";
dotenv.config();

const ContractBuildFile = z.object({
  abi: z.array(z.unknown()),
  bytecode: z.object({ object: z.string(), linkReferences: z.object({}), sourceMap: z.string() }),
  deployedBytecode: z.object({
    object: z.string().startsWith("0x"),
    linkReferences: z.object({}),
    sourceMap: z.string(),
  }),
  methodIdentifiers: z.object({}),
});

const client = createPublicClient({
  chain: foundry,
  transport: http(),
});

const testClient = createTestClient({
  chain: foundry,
  mode: "anvil",
  transport: http(),
});
const cors = require("cors");

const app = express();
app.use(cors());

var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();

const port = 3001;

const githubAppPk = process.env.appPK as string;

const formattedGithubAppPk = githubAppPk.replace(/\\n/g, "\n");

const octo = new Octo({ appId: "302483", privateKey: formattedGithubAppPk });

app.post("/rpc/:API_KEY", jsonParser, async (req, res) => {
  let validated = await validateSender(req.params.API_KEY);

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
    index: 2,
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
        let validatedJSON = ContractBuildFile.parse(fileJSON);

        let byteCode = validatedJSON.deployedBytecode.object as `0x${string}`;

        let setCode = await testClient.setCode({
          address: "0xe846c6fcf817734ca4527b28ccb4aea2b6663c79",
          bytecode: byteCode,
        });
      }
  }

  // res.send("POST REQ FROM GITHUB BELOW: \n" + JSON.stringify(req.body));
  //@ts-ignore
  res.send("yay");
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
