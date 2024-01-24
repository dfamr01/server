require("module-alias/register");

const logger = require("config/log4js")("server");

const config = require("./config/config");
// postgre should always go first
const postgre = require("./config/postgre");
const redis = require("./config/redis");
const websockets = require("./config/websockets");
const express = require("./config/express");
const passport = require("./config/passport");
const cloudinary = require("./config/cloudinary");
const { filesUtils, Currencies } = require("./shared/utils");
//const nLoger = require('./config/log4js')('SERVER');

const port = config.port;
const app = express();

postgre.then(async () => {
    filesUtils.createFolder("temp");
    Currencies.initializeCurrencies();
    passport();
    cloudinary();

    const server = app.listen(port, () => logger.info(`listening on port: ${port}`));
    await websockets(server);
    console.log(`server is running on port: ${port}`);
    logger.info("server is running");
});

module.exports = { app, postgre };
