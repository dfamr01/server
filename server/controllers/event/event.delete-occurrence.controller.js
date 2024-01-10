const logger = require('../../config/log4js')('event-delete-occurrence-ctrl');
const sequelize = require('../../config/postgre/sequelizeConnection');
const Transaction = require('../../shared/database/models/transaction.model');

const {
    occurrenceCanBeDeleted,
    filterTransactions,
    occurrenceInThePast,
} = require('../../shared/utils');
const {TRANSACTION_STATUS} = require('../../shared/config/constants');
const {refundOccurrence} = require('../../shared/helpers');
const User = require("../../shared/database/models/user.model");

exports.deleteOccurrence = async function (req, res, next) {
    try {
        const {event, user} = req;
        const {occurrenceId} = req.params;
        const {Occurrences} = event;

        if (!Occurrences || !Occurrences.length) {
            return res.status(404).jsend.fail(new Error('Occurrences was not found'));
        }

        if (event.isLive && Occurrences.length === 1) {
            return res.status(400).jsend.fail(new Error('Live events must have at least one date in the future.'));
        }

        let occurrence = Occurrences.find((occurrence) => occurrence.id === Number(occurrenceId));
        if (occurrence) {
            await sequelize.transaction(async (t) => {
                const options = {transaction: t};
                const {id: EventId, duration} = event;
                const where = {
                    status: [TRANSACTION_STATUS.SUCCEEDED.key, TRANSACTION_STATUS.FULFILLED.key],
                    EventId,
                    OccurrenceId: occurrence.id
                }

                const transactions = await Transaction.findAll({
                    where: where,
                    attributes: ['id', 'intentId', 'stripeCustomerId', 'status', 'EventId', 'WorkshopId', 'OccurrenceId'],
                    include: [
                        {
                            model: User,
                            as: 'buyerUser',
                            include: ['UserSetting', 'UserProfile']
                        }
                    ],
                    transaction: t
                });

                const filterParams = {transactions, EventId, OccurrenceId: occurrence.id};
                const hasTransactions = !!filterTransactions(filterParams).length;
                logger.info('hasTransactions: ', hasTransactions);

                const isInPast = occurrenceInThePast({occurrence}, false);
                const canDelete = occurrenceCanBeDeleted({hasTransactions, isInPast});

                if (canDelete) {
                    const res = await refundOccurrence({
                        transactions,
                        event,
                        occurrence,
                        creator: user,
                        isCanceled: true,
                        t,
                    });
                    if (res) {
                        await occurrence.destroy(options);
                    }
                } else {
                    return res.status(404).jsend.fail(new Error('Cannot delete occurrence there users who purchase the content'));
                }


            });

            return res.status(200).jsend.success({res: true});
        }
        return res.status(404).jsend.fail(new Error('Occurrence was not found'));
    } catch (err) {
        logger.warn(err.stack);
        return res.status(500).jsend.fail(err);
    }
};

