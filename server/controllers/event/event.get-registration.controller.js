const logger = require('../../config/log4js')('event-get-registration-ctrl');
const EventRegistration = require('../../shared/database/models/eventRegistration.model');

exports.getRegistration = async function (req, res, next) {
  try {
    const {user, event, eventRegistration, body, params, query} = req;
    const {adminView} = body;
    const occurrenceId = params.occurrenceId || query.occurrenceId;

    if (eventRegistration) {
      return res.status(200).jsend.success({registration: eventRegistration});
    }

    const dbQuery = {
      where: {
        EventId: event.id
      }
    };

    if (occurrenceId) {
      dbQuery.where.OccurrenceId = occurrenceId
    }

    if (!adminView) {
      dbQuery.where.UserId = user.id
    }

    return res.status(200).jsend.success({
      registrations: await EventRegistration.findAll(dbQuery),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }

};

