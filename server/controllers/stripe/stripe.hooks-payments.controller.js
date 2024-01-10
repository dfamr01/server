const logger = require('../../config/log4js')('stripe.hooks-payments');
const sequelize = require('../../config/postgre/sequelizeConnection');
const Transaction = require('../../shared/database/models/transaction.model');
const {stripeSecretKey, stripeWebhookPaymentsSig} = require('../../config/config');
const {TRANSACTION_STATUS} = require('../../shared/config/constants');
const {
  fulfilTransaction,
  unFulfilTransaction,
  failedChargeCleanup
} = require('../../shared/helpers');

// eslint-disable-next-line import/order
const stripe = require('stripe')(stripeSecretKey);

const paymentCreated = 'payment.created';
const paymentIntentSucceeded = 'payment_intent.succeeded';
const paymentIntentFailed = 'payment_intent.payment_failed';

const chargeRefunded = 'charge.refunded';
const transferCreated = 'transfer.created';
const balanceAvailable = 'balance.available';


async function countedRecursive(fn = async () => {
}, transactionId, attempts = 0, maxAttempts = 5) {
  if (attempts <= maxAttempts) {
    attempts++;
    const results = await fn(transactionId).catch((error) => {
      logger.error('[hooksPayments] Error: ', error);
      return false;
    });

    if (results) {
      return true;
    } else {
      logger.error('[hooksPayments] There was an error - retrying...');
      return countedRecursive(fn, transactionId, attempts, maxAttempts);
    }
  }

  return false;
}

exports.hooksPayments = async function (req, res, next) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookPaymentsSig);
    logger.info('[hooksPayments] ✅ Success:', event.id, event.type);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const {type, data} = event;
  const {transactionId} = data.object && data.object.metadata && data.object.metadata || {};

  switch (type) {
    case transferCreated: {
      res.json({received: true});
      break;
    }
    case paymentCreated: {
      res.json({received: true});
      break;
    }
    case balanceAvailable: {
      res.json({received: true});
      break;
    }
    case chargeRefunded: {
      if (!transactionId) {
        return false;
      }

      const results = await countedRecursive(unFulfilTransaction, transactionId);
      if (results) {
        res.json({received: true});
      }
      break;
    }
    case paymentIntentFailed: {
      if (!transactionId) {
        return false;
      }
      const results = await countedRecursive(failedChargeCleanup, transactionId);

      if (results) {
        res.json({received: true});
      }
      break;
    }
    case paymentIntentSucceeded: {
      if (!transactionId) {
        return false;
      }

      await sequelize.transaction(async (t) => {
        logger.info('[hooksPayments] Looking for transactionId: ', transactionId);
        const transaction = await Transaction.findByPk(transactionId, {
          lock: t.LOCK.UPDATE,
          transaction: t
        });

        if (!transaction) {// No transaction - throw error
          throw new Error(`Could not find transaction with the given ID - ${transactionId}`);
        }

        logger.info('[hooksPayments] Found transaction', transaction.id);

        if (transaction.status === TRANSACTION_STATUS.STARTED.key) {// Transaction status started
          transaction.intentId = data.object && data.object.id;
          transaction.status = TRANSACTION_STATUS.SUCCEEDED.key;
          await transaction.save({transaction: t});
        }

        if (transaction.status === TRANSACTION_STATUS.FULFILLED.key) {// Transaction fulfuilled dont do again
          return res.json({received: true});
        }
      });

      const results = await countedRecursive(fulfilTransaction, transactionId);
      if (results) {
        res.json({received: true});
      }
      break;
    }
    default:
      res.json({received: true});
      break
  }
};