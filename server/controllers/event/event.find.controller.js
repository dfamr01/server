const logger = require('../../config/log4js')('event-find-ctrl');
const Event = require('../../shared/database/models/event.model');

exports.find = async function (req, res, next, id) {
  try {
    const event = await Event.findOne({where: {id}, include: Event.includesForGet});

    if (!event) {
      return res.status(404).jsend.fail(new Error('Event does not exist'));
    }
    req.event = event;
    next();
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

