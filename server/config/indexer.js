/*
const logger = require('./log4js')('indexer');
const search = require('./search');
const Board = require('../shared/database/models/board.model');
const User = require('../shared/database/models/user.model');
const {processBoard, processProfile} = require('../utils');

async function execute() {
  await search.ping();
  await processAllBoards();
  await processAllProfiles();
}

async function processAllBoards() {
  return Board
    .find({})
    .cursor()
    .eachAsync((board) => processBoard(board, search))
    .catch(logger.error);
}

async function processAllProfiles() {
  return User
    .find({})
    .cursor()
    .eachAsync((progile) => processProfile(progile, search))
    .catch(logger.error);
}

module.exports = function runIndexer() {
  logger.info("Started!");
  return execute()
    .then(() => {
      logger.info("Done!");
      process.kill(process.pid);
    });
};
*/
