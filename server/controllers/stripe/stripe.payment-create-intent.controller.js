const {Op} = require('sequelize');
const moment = require('moment-timezone');
const logger = require('../../config/log4js')('stripe.payment-create-intent');
const sequelize = require('../../config/postgre/sequelizeConnection');
const Event = require('../../shared/database/models/event.model');
const Workshop = require('../../shared/database/models/workshop.model');
const Ticket = require('../../shared/database/models/ticket.model');
const Transaction = require('../../shared/database/models/transaction.model');

const {TICKET_STATUS} = require('../../shared/config/constants');
const {
  isWorkshopInFuture,
  isEventInFuture,
  isWorkshopPublished,
  isEventPublished,
  isFree,
  hasParticipantsLimit
} = require('../../shared/utils');
const {failedChargeCleanup} = require('../../shared/helpers');
const {stripeSecretKey} = require('../../config/config');
// eslint-disable-next-line import/order
const stripe = require('stripe')(stripeSecretKey);

//todo: replace all errors to constants - better error handling
exports.paymentCreateIntent = async function (req, res) {
  try {
    const {user, body} = req;
    let {eventId, workshopId, occurrenceId, savePaymentMethod} = body;
    if (!eventId && !workshopId) {
      return res.status(400).jsend.fail(new Error('Your request missing parameters'), {error: 'missingParameters'});
    }
    logger.info(`User want to purchase: eventId: ${eventId}, workshopId: ${workshopId}, occurrenceId: ${occurrenceId}`);
    logger.info('checking if user already have a ticket(preventing double purchase)');
    const where = {
      assignedToId: user.id,
      status: [TICKET_STATUS.BOUGHT.key, TICKET_STATUS.RESERVED.key],
      WorkshopId: workshopId ? workshopId : {
        [Op.eq]: null
      },
      EventId: eventId ? eventId : {
        [Op.eq]: null
      },
      OccurrenceId: occurrenceId ? occurrenceId : {
        [Op.eq]: null
      },
    };

    const existingTickets = await Ticket.findAll({
      where,
      attributes: ['status'],
      include: [
        {
          model: Transaction,
          required: true,
          attributes: ['id', 'intentId']
        }
      ]
    });

    const boughtTickets = existingTickets.filter(({status}) => status === TICKET_STATUS.BOUGHT.key);

    if (boughtTickets.length) {
      logger.info('User has ticket');
      return res.status(400).jsend.fail(new Error('You cannot buy the same thing twice.'), {error: 'doublePurchase'});
    }

    const reserveTickets = existingTickets.filter(({status}) => status === TICKET_STATUS.RESERVED.key);
    const promises = reserveTickets.map(async (ticket) => {
      const {id, intentId, createdAt} = ticket.Transaction;

      if (!intentId) {
        // If it has been 1h since the purchase was made
        // and we still dont get a intent from stripe
        if (moment().subtract(1, 'hour').isAfter(moment(createdAt))) {
          throw new Error(`An error has occurred please contact our support. Transaction ID: ${id}`);
        }

        throw new Error('processing');
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(intentId);

      if (paymentIntent.status === 'succeeded') {
        throw new Error('succeeded');
      }

      if (paymentIntent.status === 'processing') {
        throw new Error('processing');
      }

      return failedChargeCleanup(id);
    });

    if (promises.length) {
      try {
        await Promise.all(promises)
      } catch (e) {
        if (e.message === 'succeeded') {
          return res.status(400).jsend.fail(new Error('You cannot buy the same thing twice.'), {error: 'doublePurchase'});
        }

        if (e.message === 'processing') {
          return res.status(400).jsend.fail(new Error('Hold you are too fast, we are processing.'), {error: 'youAreTooFast'});
        }

        return res.status(400).jsend.fail(e, {error: 'unknown'});
      }
    }

    let item;
    let isPublished;

    logger.info('Finding the needed content');
    if (eventId) {
      item = await Event.findByPk(eventId, {include: ['Occurrences']});
      isPublished = isEventPublished;
    } else {
      const options = {
        include: [
          {
            model: Event,
            include: ['Occurrences']
          }
        ]
      };
      item = await Workshop.findByPk(workshopId, options);
      isPublished = isWorkshopPublished;
    }

    logger.info('Validating the purchase');
    if (!item) {
      return res.status(400).jsend.fail(new Error('Content you want to buy doesnt exists'), {error: 'contentDoesntExist'});
    }
    const {price, currency} = item.dataValues;


    if (item.UserId === user.id) {
      return res.status(400).jsend.fail(new Error('You cannot buy your own content'), {error: 'contentOwned'});
    }

    if (!isPublished(item.status)) {
      return res.status(400).jsend.fail(new Error('Content is not published'), {error: 'contentNotPublished'});
    }

    if (item.isPrivate) {
      return res.status(400).jsend.fail(new Error('Content is private'), {error: 'contentIsPrivate'});
    }

    if (isFree(item.paymentType) || price <= 0) {
      return res.status(400).jsend.fail(new Error('You cannot buy free content'), {error: 'contentIsFree'});
    }

    if (item.WorkshopId) {
      return res.status(400).jsend.fail(new Error('You cannot buy individual workshop event.'), {error: 'noIndividualWorkshopEvent'});
    }

    // checking if event or workshops are in the future
    if (eventId) {
      if (!isEventInFuture(item)) {
        return res.status(400).jsend.fail(new Error('To publish an live event it must be in the future'), {error: 'eventInPast'});
      }
    } else {
      if (!isWorkshopInFuture(item.Events)) {
        return res.status(400).jsend.fail(new Error('To publish a workshop it must have at least 1 live event (in future) or 1 none live event.'), {error: 'workshopInPast'});
      }
    }

    await sequelize.transaction(async (t) => {
      logger.info('Finding a ticket for user and updating status to reserved(to check if there are still available tickets)');
      delete where.assignedToId;
      where.ownerId = item.UserId;
      where.status = TICKET_STATUS.CREATED.key;
      let ticket = await Ticket.findOne(
        {
          where,
          lock: t.LOCK.UPDATE,
          transaction: t
        }
      )
        .then((ticket) => {
          if (ticket) {
            ticket.assignedToId = user.id;
            ticket.status = TICKET_STATUS.RESERVED.key;
            return ticket.save({transaction: t});
          }
          return ticket;
        });

      if (!ticket && hasParticipantsLimit(item.participantsLimit)) {
        if (workshopId || (eventId && item.isLive)) {
          logger.info('No available tickets');
          return res.status(400).jsend.fail(new Error('There are no tickets to buy.'), {error: 'noTicketsLeft'});
        }
      }

      if (!user.stripeCustomerId) {
        logger.info('first purchase creating customer');
        const customer = await stripe.customers.create();
        user.stripeCustomerId = customer.id;
        await user.save({transaction: t});
      }

      logger.info('Creating a transaction');
      const transaction = await Transaction.create({
        price,
        currency,
        EventId: eventId,
        WorkshopId: workshopId,
        OccurrenceId: occurrenceId,
        TicketId: ticket && ticket.id || null,
        stripeCustomerId: user.stripeCustomerId,
        buyerId: user.id,
        sellerId: item.UserId,
      }, {transaction: t});

      if (ticket) {
        ticket.TransactionId = transaction.id;
        await ticket.save({transaction: t});
      }

      logger.info('Creating a payment intent');

      const toSavePaymentMethod = {};
      if (savePaymentMethod) {
        toSavePaymentMethod.setup_future_usage = 'off_session';
      }
      const paymentIntent = await stripe.paymentIntents.create({
        customer: user.stripeCustomerId,
        ...toSavePaymentMethod,
        amount: price,
        currency,
        metadata: {
          transactionId: transaction.id
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      logger.info('Success returning payment intent secret to client');
      return res.status(200).jsend.success({
        clientSecret: paymentIntent.client_secret,
        transactionId: transaction.id
      });
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).jsend.fail(err);
  }
};

