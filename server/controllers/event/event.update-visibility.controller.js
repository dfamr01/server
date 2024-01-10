// noinspection ES6MissingAwait
const moment = require('moment');
const logger = require('../../config/log4js')('event-update-visibility-ctrl');
const sequelize = require('../../config/postgre/sequelizeConnection');
const Ticket = require('../../shared/database/models/ticket.model');
const {
  hasParticipantsLimit,
  getEventTicketsToCreate,
  isPaid
} = require('../../shared/utils');
const {EVENT_STATUS, UPLOAD_STATUS, USER_STRIPE_ACCOUNT_STATUS} = require('../../shared/config/constants');
const {CONNECT_TO_STRIPE, FINISH_STRIPE_ACCOUNT} = require('../../shared/config/errors');

const {refundEvent} = require('../../shared/helpers/event.help');
const {sendNewEventToFollowers} = require("../../shared/helpers/mailer.sendEmail");

exports.updateVisibility = async function (req, res, next) {
  try {
    const {event, user, body} = req;
    const {isPublished} = body;

    const {
      id: EventId,
      UserId,
      isLive,
      Occurrences,
      status,
      Upload,
      participantsLimit,
      isPrivate,
      WorkshopId
    } = event;

    if (isPaid(event.paymentType)) {
      if (!user.stripeAccountId) {
        return res.status(401).jsend.fail(new Error('Please connect to stripe first'), {error: CONNECT_TO_STRIPE});
      }

      if (user.stripeAccountStatus !== USER_STRIPE_ACCOUNT_STATUS.VERIFIED.key) {
        return res.status(401).jsend.fail(new Error('Please finish verify your Stripe account'), {error: FINISH_STRIPE_ACCOUNT});
      }
    }

    if (!isPublished && status !== EVENT_STATUS.PUBLISHED.key) {
      return res.status(400).jsend.fail(new Error('You cannot unpublish event that arent published.'));
    }

    await sequelize.transaction(async (t) => {
      const options = {transaction: t};
      if (isPublished) {
        if (status !== EVENT_STATUS.COMPLETED.key) {
          return res.status(400).jsend.fail(new Error('event is incomplete.'));
        }

        if (!isLive && (!Upload || !Upload.id || (Upload.status !== UPLOAD_STATUS.SUCCESS.key))) {
          return res.status(400).jsend.fail(new Error('You must finish uploading video!'));
        }

        const remainingOccurrences = (Occurrences || [])
          .filter(({date}) => moment().isSame(date) || moment().isBefore(date));

        if (Occurrences.length > 0 && remainingOccurrences.length < 1) {
          return res.status(400).jsend.fail(new Error('To publish an event it should have no date or at least 1 date in the future'));
        }

        if (hasParticipantsLimit(participantsLimit) && isLive && !WorkshopId) {
          logger.info('creating tickets');
          const ticketsCreated = await Ticket.findAll({
            where: {EventId},
            attributes: ['id', 'OccurrenceId'], ...options
          });
          const params = {
            participantsLimit,
            EventId,
            UserId,
            occurrences: remainingOccurrences,
            ticketsCreated
          };
          const ticketsToCreate = getEventTicketsToCreate(params);
          if (ticketsToCreate.length) {
            await Ticket.bulkCreate(ticketsToCreate, options);
          }
        }
      } else { //unpublish
        const canUnpublish = await refundEvent({event, creator: user, isCanceled: true, t});
        if (!canUnpublish) {
          const error = 'Cannot unpublish this event, it has users who purchase this content'
          return res.status(404).jsend.fail(new Error(error));
        }
      }

      event.status = isPublished
        ? EVENT_STATUS.PUBLISHED.key
        : EVENT_STATUS.COMPLETED.key;

      logger.info('updating visibility to: ', event.status);

      const updatedEvent = await event.save(options);

      if (!isPrivate && isPublished && !event.WorkshopId) {
        sendNewEventToFollowers({
          creator: user,
          creatorId: user.id,
          event,
        });
      }

      return res.status(200).jsend.success({status: updatedEvent.status});
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};


/*
        //  when registering a free live event or workshop we are still creating a ticket and registration
        //  actions happens here apply to all occurrences.
        //  every time user publish we treat it as a complete new resell that means that previous purchases/refunded ticket or anything else
        //  doesnt count at all and new participantLimit - tickets are created
        if (isLive) {
          if (isFree) {
            // remove ticket
            // remove accessControl
            // remove registration
            // remove transaction
            // unpublish event
          } else {
            event.Occurrences.foreach((occurrence) => {
                if (occurrence.hasTickets) {
                  if(occurrence.date >= now) {
                    // mark as unpublished
                    // delete all tickets with "created" status
                    //

                    if (!event.isRecorded) {
                      // remove accessControls
                      // remove registration
                      // leave transaction.
                    }
                  } else {
                    // only case we refund for live events and the actions is done after
                    // refund was successful.
                    // mark as unpublished
                    // delete all tickets with "created" status
                    // refund all the tickets - after refund delete the ticket too.
                    // remove accessControls
                    // remove registration
                    // leave transaction.
                  }
                } else {
                  // remove ticket
                  // remove accessControl
                  // remove registration
                  // remove transaction
                  // unpublish event
                }
              }
            });
        } else {
          if (isFree) {
            // unpublish event
          } else {
            if (event.hasTickets) {
              // mark as unpublished
            } else {
              // unpublish event
            }
          }
        }
        */
