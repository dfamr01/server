const logger = require('../../config/log4js')('user-get-registrations-ctrl');
const WorkshopRegistration = require('../../shared/database/models/workshopRegistration.model');
const EventRegistration = require('../../shared/database/models/eventRegistration.model');

exports.getRegistrations = async function getRegistrations(req, res, next) {
  try {
    const {user, query} = req;
    const eventId = query.eventId ? Number(query.eventId) : null;
    const occurrenceId = query.occurrenceId ? Number(query.occurrenceId) : null;
    const workshopId = query.workshopId ? Number(query.workshopId) : null;

    const dbQuery = {
      where: {
        UserId: user.id
      }
    };
    let model = WorkshopRegistration;
    if (workshopId) {
      dbQuery.where.WorkshopId = workshopId;
    } else {
      model = EventRegistration;
      if (eventId) {
        dbQuery.where.EventId = eventId;
      }
      if (occurrenceId) {
        dbQuery.where.OccurrenceId = occurrenceId;
      }
    }

    const registrations = await model.findAll(dbQuery);
    return res.status(200).jsend.success({
      registrations: registrations
        .map((registratsion) => registratsion.filterFieldsFor({key: 'get'}))
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

