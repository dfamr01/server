const logger = require('../../config/log4js')('user-updateProfile-ctrl');
const {USER_STATUS} = require('../../shared/config/constants');

exports.updateProfile = async function (req, res, next) {
  try {
    const {user} = req;
    if (!user || user.status === USER_STATUS.DELETED.key) {
      return res.status(401).jsend.fail('unauthorised');
    }

    const UserProfile = await user.getUserProfile();
    if (!req.body.dateOfBirth) {
      req.body.dateOfBirth = null;
    }
    const updatedUserProfile = await UserProfile.filterUpdateFieldsFor({key: 'update', data: req.body});

    return res.status(200).jsend.success({
      userSettings: updatedUserProfile.filterFieldsFor({key: 'get'}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

