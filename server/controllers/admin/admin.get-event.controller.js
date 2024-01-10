const logger = require('../../config/log4js')('admin-get-event');

exports.getEvent = function (req, res, next) {
  try {
    const {event} = req;
    return res.status(200).jsend.success({
      event: event.filterFieldsFor({key: 'get', rootOnly: true}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

