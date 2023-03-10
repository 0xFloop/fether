import express from "express";
const app = express();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();

const port = 3001;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/payload", jsonParser, (req, res) => {
  //@ts-ignore

  console.log("POST REQ FROM GITHUB BELOW: \n");
  console.log(JSON.stringify(req.body, null, 2));
  // res.send("POST REQ FROM GITHUB BELOW: \n" + JSON.stringify(req.body));
  //@ts-ignore
  res.send("POST REQ FROM GITHUB BELOW : \n" + JSON.stringify(req.body));
});

app.listen(port, () => {
  return console.log(`Express is listening testat http://localhost:${port}`);
});
