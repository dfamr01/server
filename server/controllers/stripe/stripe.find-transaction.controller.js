const Transaction = require("../../shared/database/models/transaction.model");
const {TRANSACTION_STATUS} = require("../../shared/config/constants");
const Event = require("../../shared/database/models/event.model");
const Occurrence = require("../../shared/database/models/occurrence.model");

exports.findTransaction = async function (req, res, next) {
  const {EventId, OccurrenceId, WorkshopId} = req.body;
  const {user} = req;

  if (!EventId && !OccurrenceId /*&& !WorkshopId*/) {
    return res.status(400).jsend.fail(new Error('Missing parameters'), {error: 'missingParams'});
  }

  const transaction = await Transaction.findOne({
    where: {
      buyerId: user.id,
      EventId,
      OccurrenceId,
      // WorkshopId,
      status: TRANSACTION_STATUS.FULFILLED.key
    },
    include: [
      {
        model: Event,
        attributes: ['id', 'isLive', 'title', 'coverPhotoDetails']
      },
      {
        model: Occurrence,
        attributes: ['id', 'date']
      }
    ]
  });

  if (!transaction) {
    return res.status(400).jsend.fail(new Error('Transaction was not found'), {error: 'transactionNoFound'});
  }

  req.transaction = transaction;
  return next();
}
