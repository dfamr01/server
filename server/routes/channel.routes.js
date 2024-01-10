const express = require('express');
//const logger = require('../config/log4js')('auth router');

const {
  get
} = require('../controllers/channel');

module.exports = function (apiRouter) {
  const userRouter = express.Router();

  // Path: /events
  apiRouter.use('/channel', userRouter);

  // Channel
  // Path: /channel/:channelId
  // ==================================================
  userRouter.route('/:channelId')
    .get(get);

};
