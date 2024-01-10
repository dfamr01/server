const logger = require('../../config/log4js')('event-get-registration-ctrl');
const EventRegistration = require('../../shared/database/models/eventRegistration.model');

exports.getAllRegistration = async function (req, res, next) {
  try {
    const {user} = req;
    let {ids, EventId, OccurrenceId, WorkshopId} = req.query;

    const query = {
      where: {
        UserId: user.id
      }
    };

    if (ids && ids.length) {
      query.where.EventId = ids;
    }

    if (EventId) {
      query.where.EventId = EventId;
    }

    if (OccurrenceId) {
      query.where.OccurrenceId = OccurrenceId;
    }

    if (WorkshopId) {
      query.where.WorkshopId = WorkshopId;
    }

    return res.status(200).jsend.success({
      registrations: await EventRegistration.findAll(query),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }

};

