const express = require('express');
//  const logger = require('../config/log4js')('auth router');

const {requireLogin, requireActive} = require('../controllers/authentication');
const {
  accountCheck,
  accountCreate,
  accountCreateLink,
  paymentCreateIntent,
  paymentDeleteMethod,
  transactionFailed,
  paymentListMethods,
  paymentNewCharge,
  paymentUpdateDpm,
  getDashboardLink,
  findTransaction,
  canCreateRefund,
  refundContent,
} = require('../controllers/stripe');

module.exports = function (apiRouter) {
  const userRouter = express.Router();

  // Path: /user
  apiRouter.use('/stripe', userRouter);

  userRouter.all('*', requireLogin, requireActive);

  // stripe
  // Path: /stripe/create-check
  // ==================================================
  userRouter.route('/create-check')
    .get(accountCheck);

  // stripe
  // Path: /stripe/get-dashboard-link
  // ==================================================
  userRouter.route('/get-dashboard-link')
    .get(getDashboardLink);

  // stripe
  // Path: /stripe/create-account
  // ==================================================
  userRouter.route('/create-account')
    .post(accountCreate);

  // stripe
  // Path: /stripe/create-account-link
  // ==================================================
  userRouter.route('/create-account-link')
    .post(accountCreateLink);

  // stripe
  // Path: /stripe/payment-create-intent
  // ==================================================
  userRouter.route('/payment-create-intent')
    .post(paymentCreateIntent);

  // stripe
  // Path: /stripe/payment-delete-method/:paymentMethodId
  // ==================================================
  userRouter.route('/payment-delete-method/:paymentMethodId')
    .delete(paymentDeleteMethod);

  // stripe
  // Path: /stripe/payment-list-methods
  // ==================================================
  userRouter.route('/payment-list-methods')
    .get(paymentListMethods);

  // stripe
  // Path: /stripe/payment-new-charge
  // ==================================================
  userRouter.route('/payment-new-charge')
    .post(paymentNewCharge);

  // stripe
  // Path: /stripe/payment-new-charge
  // ==================================================
  userRouter.route('/payment-update-dpm')
    .patch(paymentUpdateDpm);

  // stripe
  // Path: /stripe/transaction-failed/:transactionId
  // ==================================================
  userRouter.route('/transaction-failed/:transactionId')
    .post(transactionFailed);

  userRouter.route('/create-content-refund')
    .post(findTransaction, canCreateRefund, refundContent);

};
