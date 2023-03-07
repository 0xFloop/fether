import express from "express";
const app = express();
const port = 3001;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/payload", (req, res) => {
  console.log("POST REQ FROM GITHUB BELOW: \n");
  console.log(req.body.payload);
  console.log(req);
  res.send("POST REQ FROM GITHUB BELOW: \n" + JSON.stringify(req.body));
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
