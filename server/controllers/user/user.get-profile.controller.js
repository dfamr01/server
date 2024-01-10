const logger = require('../../config/log4js')('user-getProfile-ctrl');

exports.getProfile = async function (req, res, next) {
  const UserProfile = await req.user.getUserProfile({includes: ['Addresses']});

  try {
    return res.status(200).jsend.success({
      userProfile: UserProfile.filterFieldsFor({key: 'get'}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

