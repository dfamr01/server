const logger = require('../../config/log4js')('stripe.payment-transaction-failed.controller');
const {failedChargeCleanup} = require("../../shared/helpers");

// eslint-disable-next-line import/order

exports.transactionFailed = async function (req, res, next) {
  try {
    const {user, params} = req;
    const {transactionId} = params;
    if (!transactionId) {
      throw new Error('Could not find transaction with the given ID');
    }

    logger.error(`transactionFailed id ${transactionId}`);

    await failedChargeCleanup(transactionId);

    return res.status(200).jsend.success({success: true});
  } catch (err) {
    return res.status(500).jsend.fail(err);
  }
};