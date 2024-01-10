const logger = require('../../config/log4js')('user-refund-content-ctrl');
const sequelize = require('../../config/postgre/sequelizeConnection');
const {TRANSACTION_STATUS} = require('../../shared/config/constants');
const {stripeSecretKey} = require('../../config/config');
const {sendRefundContent} = require("../../shared/helpers/mailer.sendEmail");
const {purchaseCleanup} = require("../../shared/helpers/general.help");

// eslint-disable-next-line import/order
const stripe = require('stripe')(stripeSecretKey);

exports.refundContent = async function (req, res, next) {
  const {EventId, OccurrenceId, WorkshopId} = req.body;

  try {
    const {user, transaction} = req;

    await sequelize.transaction(async (t) => {
      const options = {transaction: t};

      let alreadyRefunded = false;
      const refundRes = await stripe.refunds.create({
        payment_intent: transaction.intentId,
        metadata: {
          transactionId: transaction.id
        }
      }).catch(err => {
        if (err.code !== 'charge_already_refunded') {
          logger.error('this transaction was already refunded transaction id', transaction.id);
          throw(err);
        } else {
          alreadyRefunded = true;
        }
      });

      logger.info('Changed transaction status to refund started');

      if (alreadyRefunded || refundRes.status === "succeeded") {
        transaction.status = TRANSACTION_STATUS.REFUNDED.key;
        await transaction.save(options);
        await purchaseCleanup({
          EventId,
          OccurrenceId,
          t,
          sendCancelMail: false,
        });

        if (!alreadyRefunded) {
          await sendRefundContent({
            user,
            UserId: user.id,
            creatorId: transaction.sellerId,
            EventId,
            OccurrenceId,
            WorkshopId,
            event: transaction.Event,
            occurrence: transaction.Occurrence,
            price: (refundRes.amount / 100),
            currency: refundRes.currency,
            transactionId: transaction.id,
            stripeRefundId: refundRes.id,
            stripePaymentIntent: refundRes.payment_intent,
            stripeCustomerId: transaction.stripeCustomerId,
            t
          });
        }
      } else {
        transaction.status = TRANSACTION_STATUS.REFUND_STARTED.key;
        await transaction.save(options);
      }

      return res.status(200).jsend.success({
        res: refundRes
      });
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

