const logger = require('../../config/log4js')('event-update-settings-ctrl');

exports.updateSettings = async function (req, res, next) {
  try {
    const {event} = req;

    const eventSetting = await event.EventSetting.filterUpdateFieldsFor({key: 'update', data: req.body});

    return res.status(200).jsend.success({
      eventSettings: eventSetting.filterFieldsFor({key: 'get'}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

