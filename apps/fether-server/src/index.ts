import express from "express";
import { App as Octo } from "octokit";
import { getContractAddress, parseUnits } from "viem";

import { validateSender } from "./utils/validate";
import { ContractBuildFileZod, formattedGithubAppPk, port, testAbi } from "./utils/config";
import { address, publicClient, walletClient } from "./utils/viemClients";
const app = express();
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const cors = require("cors");
app.use(cors());
const octo = new Octo({ appId: "302483", privateKey: formattedGithubAppPk });

app.post("/rpc/:API_KEY", jsonParser, async (req, res) => {
  console.log(req.body.method);

  let validated = await validateSender(req.params.API_KEY);
  if (!validated) {
    res.set("Access-Control-Allow-Origin", "*");
    let error = {
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Invalid Fether api key. Get api key here https://www.fether.xyz.",
      },
      id: "1",
    };

    res.status(500);
    res.json(error);
  } else {
    let response = await fetch("http://127.0.0.1:8545", {
      method: "POST",
      body: JSON.stringify(req.body),
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
        let abi = validatedJSON.abi;

        let nonce = await publicClient.getTransactionCount({
          address,
        });

        let contractAddress = getContractAddress({
          from: address,
          nonce: parseUnits(`${nonce}`, 1),
        });

        console.log(contractAddress);
        console.log(abi);

        let deployTx = await walletClient.deployContract({
          bytecode: byteCode,
          abi: abi,
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
