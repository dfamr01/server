// noinspection ES6MissingAwait

const logger = require('../../config/log4js')('workshop-update-visibility-ctrl');
const sequelize = require('../../config/postgre/sequelizeConnection');
const Ticket = require('../../shared/database/models/ticket.model');
const Occurrence = require('../../shared/database/models/occurrence.model');
const WorkshopRegistration = require('../../shared/database/models/workshopRegistration.model');
const UserFollowing = require('../../shared/database/models/userFollowing.model');
const User = require('../../shared/database/models/user.model');
const {
  getWorkshopTicketsToCreate,
  isWorkshopInFuture,
  cloudinaryUrlWithTrans,
  getUserDetails,
  getWorkshopSchedule,
  getWorkshopEventsEmailInfo,
  hasParticipantsLimit,
  getMailSignature,
  isPaid
} = require('../../shared/utils');
const {WORKSHOP_STATUS, EVENT_STATUS, USER_STRIPE_ACCOUNT_STATUS} = require('../../shared/config/constants');
const {CONNECT_TO_STRIPE, FINISH_STRIPE_ACCOUNT} = require('../../shared/config/errors');
const {coverPhotoInspect} = require('../../config/config');
const {enqueueMail} = require('../../shared/helpers/mailer.help');
const {refundWorkshop} = require('../../shared/helpers/workshop.help');
const {sendCancelWorkshop, sendNewWorkshopToFollowers} = require("../../shared/helpers/mailer.sendEmail");

exports.updateVisibility = async function (req, res, next) {
  try {
    const {workshop, user, body} = req;
    const {isPublished} = body;

    const {
      id: WorkshopId,
      UserId,
      status,
      participantsLimit,
    } = workshop;

    if (isPaid(workshop.paymentType)) {
      if (!user.stripeAccountId) {
        return res.status(401).jsend.fail(new Error('Please connect to stripe first'), {error: CONNECT_TO_STRIPE});
      }

      if (user.stripeAccountStatus !== USER_STRIPE_ACCOUNT_STATUS.VERIFIED.key) {
        return res.status(401).jsend.fail(new Error('Please finish verify your Stripe account'), {error: FINISH_STRIPE_ACCOUNT});
      }
    }

    if (!isPublished && status !== WORKSHOP_STATUS.PUBLISHED.key) {
      return res.status(400).jsend.fail(new Error('You cannot unpublish workshop that arent published.'));
    }

    await sequelize.transaction(async (t) => {
      const options = {transaction: t};
      const events = await workshop.getEvents({
        where: {status: EVENT_STATUS.PUBLISHED.key},
        attributes: ['id', 'isLive', 'paymentType', 'duration'],
        include: {
          model: Occurrence,
          attributes: ['id', 'date'],
        },
        ...options
      });
      if (isPublished) {
        if (status === WORKSHOP_STATUS.PUBLISHED.key) {
          return res.status(400).jsend.fail(new Error('Workshop is already published.'));
        }

        if (status !== WORKSHOP_STATUS.COMPLETED.key) {
          return res.status(400).jsend.fail(new Error('Workshop is incomplete.'));
        }

        if (events.length < 2) {
          return res.status(400).jsend.fail(new Error('To publish a workshop you must first publish at least 2 events'));
        }

        if (!isWorkshopInFuture(events)) {
          return res.status(400).jsend.fail(new Error('To publish a workshop it must have at least 1 live event (in future) or 1 none live event'));
        }

        logger.info('creating tickets');
        logger.info('participantsLimit: ', participantsLimit);
        if (hasParticipantsLimit(participantsLimit)) {
          let params = {
            where: {WorkshopId},
            ...options
          };
          const ticketsCreatedCount = await Ticket.count(params);
          params = {
            participantsLimit,
            WorkshopId,
            UserId,
            ticketsCreatedCount
          };
          const ticketsToCreate = getWorkshopTicketsToCreate(params);
          if (ticketsToCreate.length) {
            await Ticket.bulkCreate(ticketsToCreate, options);
          }
        }
      } else {
        // send cancellation notification to all users
        await refundWorkshop({workshop, events, creator: user, t});
      }

      workshop.status = isPublished
        ? WORKSHOP_STATUS.PUBLISHED.key
        : WORKSHOP_STATUS.COMPLETED.key;

      const updatedWorkshop = await workshop.save(options);

      if (!workshop.isPrivate && isPublished) {
        sendNewWorkshopToFollowers({
          creator: user,
          creatorId: workshop.UserId,
          workshop,

        })
      }
      return res.status(200).jsend.success({status: updatedWorkshop.status});
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

