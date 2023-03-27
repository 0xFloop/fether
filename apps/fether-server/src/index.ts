import express from "express";
import { App as Octo } from "octokit";
import * as dotenv from "dotenv";
import * as ganache from "ganache";
import { createPublicClient, http } from "viem";
import { localhost } from "viem/chains";
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

const options = {};
const server = ganache.server(options);
const ganachePORT = 8545; // 0 means any available port
let testAccount: `0x${string}`;

const client = createPublicClient({
  chain: localhost,
  transport: http(),
});

server.listen(ganachePORT, async (err) => {
  if (err) throw err;

  console.log(`ganache listening on port ${server.address().port}...`);
  const provider = server.provider;
  const accounts = await provider.request({
    method: "eth_accounts",
    params: [],
  });
  testAccount = accounts[0] as `0x${string}`;
});

const app = express();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();

const port = 3001;

const pk = process.env.appPK as string;

const formattedPk = pk.replace(/\\n/g, "\n");

const octo = new Octo({ appId: "302483", privateKey: formattedPk });

app.get("/", (req, res) => {
  res.send("Hello  World!");
});

app.post("/payload", jsonParser, async (req, res) => {
  console.log("Test account balance BELOW");

  console.log(await client.getBalance({ address: testAccount }));
  //@ts-ignore
  const octokit = await octo.getInstallationOctokit(req.body.installation.id);

  let modifiedContractPath: string;
  for (let i = 0; i < req.body.commits.length; i++) {
    for (let j = 0; j < req.body.commits[i].modified.length; j++)
      if (req.body.commits[i].modified[j].slice(-3) == "sol") {
        modifiedContractPath = req.body.commits[i].modified[j];

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
        let fileJSON = JSON.stringify(contentsReq.data);
        ContractBuildFile.parse(contentsReq.data);
        console.log(contentsReq.data);
      }
  }

  // res.send("POST REQ FROM GITHUB BELOW: \n" + JSON.stringify(req.body));
  //@ts-ignore
  res.send("yay");
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
