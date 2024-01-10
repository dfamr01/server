const logger = require('../../config/log4js')('workshop-get-registration-ctrl');
const WorkshopRegistration = require('../../shared/database/models/workshopRegistration.model');
const EventRegistration = require('../../shared/database/models/eventRegistration.model');

async function getEventRegistration(workshop) {
  const events = await workshop.getEvents({attributes: ['id']});
  return EventRegistration.findAll({
    where: {
      EventId: (events || []).map((event) => event.id)
    }
  });
}

exports.getRegistration = async function (req, res, next) {
  try {
    const {workshop, workshopRegistration, user, body} = req;
    const {adminView} = body;

    if (workshopRegistration) {
      return res.status(200).jsend.success({
        registration: {
          events: await getEventRegistration(workshop),
          workshop: workshopRegistration
        },
      });
    }

    const query = {
      where: {
        WorkshopId: workshop.id
      }
    };

    if (!adminView) {
      query.where.UserId = user.id
    }

    if (!adminView) {
      return res.status(200).jsend.success({
        registration: {
          events: await getEventRegistration(workshop),
          workshop: await WorkshopRegistration.findOne(query)
        },
      });
    }

    return res.status(200).jsend.success({
      registrations: await WorkshopRegistration.findAll(query),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }

};

