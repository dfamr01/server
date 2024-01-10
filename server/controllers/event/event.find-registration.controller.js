const logger = require('../../config/log4js')('workshop-find-registration-ctrl');
const EventRegistration = require('../../shared/database/models/eventRegistration.model');

exports.findRegistration = async function (req, res, next, id) {
  try {
    const eventRegistration = await EventRegistration.findByPk(id);

    if (!eventRegistration) {
      return res.status(404).jsend.fail(new Error('Event registration does not exist'));
    }
    req.eventRegistration = eventRegistration;
    next();
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

