const logger = require('../../config/log4js')('event-get-settings-ctrl');

exports.getSettings = function (req, res, next) {
  try {
    return res.status(200).jsend.success({
      eventSettings: req.event.EventSetting.filterFieldsFor({key: 'get', rootOnly: true}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

