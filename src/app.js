const express = require("express");

const app = express();

app.use("/test", (req, res) => {
  res.send("Hellowwwwwwwwwww from server");
});

app.listen(3000, () => {
  console.log("server is suvvessfully listening");
});
