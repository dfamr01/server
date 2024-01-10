const {pick} = require('lodash');
const logger = require('../../config/log4js')('event-post-occurrence-ctrl');
const sequelize = require('../../config/postgre/sequelizeConnection');
const Occurrence = require('../../shared/database/models/occurrence.model');
const Ticket = require('../../shared/database/models/ticket.model');
const {
  getOccurrenceErrors,
  isEventPublished,
  getEventTicketsToCreate,
  hasParticipantsLimit
} = require('../../shared/utils');
const {
  createEventRoom,
  createPollRoom
} = require("../../websocket/chat/chatUtils/chatHelpers");

exports.postOccurrence = async function (req, res, next) {
  try {
    const {body, event} = req;

    const {
      id: EventId,
      UserId,
      isLive,
      participantsLimit,
      WorkshopId
    } = event;

    const errors = getOccurrenceErrors(event.duration, body, event.Occurrences);
    if (errors) {
      return res.status(400).jsend.fail(new Error(errors), errors);
    }

    if (!!event.WorkshopId && event.Occurrences.length) {
      const error = 'Events that belong to a workshop can only have 1 date.';
      return res.status(400).jsend.fail(new Error(error), error);
    }

    await sequelize.transaction(async (t) => {
      const options = {transaction: t};
      const occurrence = await event.createOccurrence(pick(body, Occurrence.getAllowedFieldsByKey('create')),);
      createEventRoom(UserId, EventId, occurrence.id);
      createPollRoom(UserId, EventId, occurrence.id);

      if (isEventPublished(event.status)) {
        if (hasParticipantsLimit(participantsLimit) && isLive && !WorkshopId) {
          logger.info('creating tickets');
          let params = {
            where: {
              EventId,
              OccurrenceId: occurrence.id
            },
            attributes: ['id'],
            ...options
          };
          const ticketsCreated = await Ticket.findAll(params);
          params = {
            participantsLimit,
            EventId,
            UserId,
            occurrences: [occurrence],
            ticketsCreated,
            forOccurrence: true
          };
          const ticketsToCreate = getEventTicketsToCreate(params);
          if (ticketsToCreate.length) {
            await Ticket.bulkCreate(ticketsToCreate, options);
          }
        }
      }
      return res.status(200).jsend.success({
        occurrence: occurrence.filterFieldsFor({key: 'get'}),
      });
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};
