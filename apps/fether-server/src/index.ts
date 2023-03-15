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
  console.log("POST REQ FROM GITHUB BELOW: \n" + JSON.stringify(req.body));

  for (let i = 0; i < req.body.commits.length; i++) {
    for (let j = 0; j < req.body.commits[i].modified.length; j++)
      console.log("modified file: " + req.body.commits[i].modified[j]);
  }
  //@ts-ignore
  const octokit = await octo.getInstallationOctokit(req.body.installation.id);
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

  // res.send("POST REQ FROM GITHUB BELOW: \n" + JSON.stringify(req.body));
  //@ts-ignore
  res.send("yay");
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
