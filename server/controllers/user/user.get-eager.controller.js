const logger = require('../../config/log4js')('user-getEager-ctrl');
const User = require('../../shared/database/models/user.model');
const UserProfile = require('../../shared/database/models/userProfile.model');
const UserFollowing = require('../../shared/database/models/userFollowing.model');

exports.getEager = async function (req, res, next) {
  try {
    const user = await User.findByPk(req.user.id, {include: User.includesForEager});
    const followersCount = await UserFollowing.count({where: {toUserId: user.id}}) || 0;
    const userFilteredFields = user.filterFieldsFor({key: 'getEager'})
    const fields = UserProfile.getAllowedFieldsByKey('getEager');
    const userProfiles = {};
    fields.forEach((key) => {
      userProfiles[key] = user.UserProfile.get(key);
    });
    return res.status(200).jsend.success({
      user: {
        ...userFilteredFields,
        userProfile: {
          ...userFilteredFields.userProfile,
          ...userProfiles,
          followersCount
        }
      },
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

