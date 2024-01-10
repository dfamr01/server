const logger = require('../../config/log4js')('event-delete-ctrl');
const sequelize = require('../../config/postgre/sequelizeConnection');
const {EVENT_STATUS} = require('../../shared/config/constants');
const {
  isEventInFuture, isPaid,
} = require('../../shared/utils');

const {refundEvent} = require('../../shared/helpers/event.help');
const {hasTransactions} = require('../../shared/helpers');
const {sendCancelEvent} = require("../../shared/helpers/mailer.sendEmail");

exports.eventDelete = async function (req, res, next) {
  try {
    const {event, user} = req;
    await sequelize.transaction(async (t) => {
      if (event.WorkshopId) {
        const workshopTransactions = await hasTransactions({WorkshopId: event.WorkshopId, t});
        if (workshopTransactions) {
          return res.status(400).jsend.fail(new Error('You cannot delete workshop event that has purchases.'), {error: 'contentHasTransactions'});
        }
      }

      const options = {transaction: t};
      const canDelete = await refundEvent({event, creator: user, t});
      if (canDelete) {
        await event.destroy(options);
      } else {
        logger.info(`Marking event as delete. because theres either no transactions, 
        or live event where none of the occurrences happened yet.`);
        event.status = EVENT_STATUS.DELETED.key;
        await event.save(options);
      }

      if (!isPaid(event.paymentType) && event.isLive && isEventInFuture(event)) {
        // send cancellation notification to all users
        sendCancelEvent({
          event
        });
      }
    });

    return res.status(200).jsend.success({res: true});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

