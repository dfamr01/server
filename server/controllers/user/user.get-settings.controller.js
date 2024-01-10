const logger = require('../../config/log4js')('user-getSettings-ctrl');

exports.getSettings = async function (req, res, next) {
  const UserSetting = await req.user.getUserSetting();
  try {
    return res.status(200).jsend.success({
      userSettings: UserSetting.filterFieldsFor({key: 'get'}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

