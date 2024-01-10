const logger = require('../../config/log4js')('user-updateSettings-ctrl');
const {USER_STATUS} = require('../../shared/config/constants');

exports.updateSettings = async function (req, res, next) {
  try {
    const {user} = req;
    if (!user || user.status === USER_STATUS.DELETED.key) {
      return res.status(401).jsend.fail('unauthorised');
    }

    const UserSetting = await user.getUserSetting();
    const updatedUserSetting = await UserSetting.filterUpdateFieldsFor({key: 'update', data: req.body});
    return res.status(200).jsend.success({
      userSettings: updatedUserSetting.filterFieldsFor({key: 'get'}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

