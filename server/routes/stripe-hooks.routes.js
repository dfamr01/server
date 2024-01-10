const express = require('express');
const bodyParser = require('body-parser');
//  const logger = require('../config/log4js')('auth router');

const {
  hooksConnect,
  hooksPayments,
} = require('../controllers/stripe');

module.exports = function (apiRouter) {
  const userRouter = express.Router();
  userRouter.use(bodyParser.raw({type: 'application/json'}));

  // Path: /stripe-hooks
  apiRouter.use('/stripe-hooks', userRouter);

  // Path: /stripe-hooks/connect
  userRouter.route('/connect')
    .post(hooksConnect);

  // Path: /stripe-hooks/payments
  userRouter.route('/payments')
    .post(hooksPayments);
};
