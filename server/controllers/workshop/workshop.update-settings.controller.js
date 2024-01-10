const logger = require('../../config/log4js')('workshop-update-settings-ctrl');

exports.updateSettings = async function (req, res, next) {
  try {
    const {workshop} = req;
    const workshopSetting = await workshop.WorkshopSetting.filterUpdateFieldsFor({key: 'update', data: req.body});

    return res.status(200).jsend.success({
      workshopSettings: workshopSetting.filterFieldsFor({key: 'get'}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

