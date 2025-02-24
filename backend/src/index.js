const express = require("express");
const { PORT } = require("./config/serverConfig");

const setUpandStartServer = async () => {
  const app = express();
  app.listen(PORT, () => {
    console.log(`Server Listening to ${port}`);
  });
};
setUpandStartServer();
