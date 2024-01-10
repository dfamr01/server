const express = require('express');
//const logger = require('../config/log4js')('auth router');

const {requireLogin, requireActive} = require('../controllers/authentication');
const {
  find,
  payoutGenerate,
  payoutGet,
  payoutGetAll,
  payoutRequestTransfer,
} = require('../controllers/payout');

module.exports = function (apiRouter) {
  const userRouter = express.Router();

  // Path: /payout
  apiRouter.use('/payout', userRouter);
  // SECURE ROUTES
  userRouter.all('*', requireLogin, requireActive);

  // Payout
  // Path: /payout/generate
  // ==================================================
  userRouter.route('/generate')
    .get(payoutGenerate);

  // Payout
  // Path: /payout/all
  // ==================================================
  userRouter.route('/all')
    .get(payoutGetAll);

  // Payout
  // Path: /payout/:payoutId/request-transfer
  // ==================================================
  userRouter.route('/:payoutId/request-transfer')
    .post(payoutRequestTransfer);

  // Payout
  // Path: /payout/:payoutId
  // ==================================================
  userRouter.route('/:payoutId')
    .get(payoutGet);

  userRouter.param('payoutId', find);
};
