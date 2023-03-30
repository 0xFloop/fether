import express from "express";
import { App as Octo } from "octokit";
import * as dotenv from "dotenv";
import { createTestClient, http } from "viem";
import { foundry } from "viem/chains";
import { z } from "zod";
dotenv.config();
const ContractBuildFile = z.object({
  abi: z.array(z.unknown()),
  bytecode: z.object({ object: z.string(), linkReferences: z.object({}), sourceMap: z.string() }),
  deployedBytecode: z.object({
    object: z.string(),
    linkReferences: z.object({}),
    sourceMap: z.string(),
  }),
  methodIdentifiers: z.object({}),
});

const client = createTestClient({
  chain: foundry,
  mode: "anvil",
  transport: http(),
});

const app = express();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();

const port = 3001;

const githubAppPk = process.env.appPK as string;

const formattedGithubAppPk = githubAppPk.replace(/\\n/g, "\n");

const octo = new Octo({ appId: "302483", privateKey: githubAppPk });

app.get("/", (req, res) => {
  res.send("Hello  World!");
});

app.post("/payload", jsonParser, async (req, res) => {
  //@ts-ignore
  const octokit = await octo.getInstallationOctokit(req.body.installation.id);
  const mine = await client.mine({ blocks: 2 });
  for (let i = 0; i < req.body.commits.length; i++) {
    for (let j = 0; j < req.body.commits[i].modified.length; j++)
      if (req.body.commits[i].modified[j].slice(-3) == "sol") {
        let modifiedContractPath: string = req.body.commits[i].modified[j];

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

        let byteCode = validatedJSON.deployedBytecode.object;
      }
  }

  // res.send("POST REQ FROM GITHUB BELOW: \n" + JSON.stringify(req.body));
  //@ts-ignore
  res.send("yay");
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
