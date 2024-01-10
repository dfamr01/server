const logger = require('../../config/log4js')('admin-delete-event');
const {EVENT_STATUS} = require('../../shared/config/constants');

exports.deleteEvent = async function (req, res, next) {
  try {
    const {event} = req;
    event.status = EVENT_STATUS.DELETED.key;
    await event.save();
    return res.status(200).jsend.success({success: true});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

