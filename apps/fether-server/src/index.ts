import express from "express";
import { App as Octo } from "octokit";
import * as dotenv from "dotenv";
dotenv.config();
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
  //@ts-ignore
  const octokit = await octo.getInstallationOctokit(req.body.installation.id);

  let modifiedContractPath: string;
  for (let i = 0; i < req.body.commits.length; i++) {
    for (let j = 0; j < req.body.commits[i].modified.length; j++)
      if (req.body.commits[i].modified[j].slice(-3) == "sol") {
        console.log("modified solidity file: " + req.body.commits[i].modified[j] + "\n\n\n");
        modifiedContractPath = req.body.commits[i].modified[j];
        let contentsReq = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
          owner: "0xfloop",
          repo: "fether",
          path: "apps/fether-server/src/index.ts",
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
            Accept: "application/vnd.github.raw",
          },
        });
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
