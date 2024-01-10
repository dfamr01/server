const logger = require('../../config/log4js')('channel-get-ctrl');
const User = require('../../shared/database/models/user.model');
const UserFollowing = require('../../shared/database/models/userFollowing.model');

const {getUserDetails} = require('../../shared/utils');

exports.get = async function (req, res, next) {
  try {
    const {channelId} = req.params;
    const user = await User.findByPk(channelId, {include: User.includesForChannel});

    if (!user) {
      return res.status(404).jsend.fail(new Error('Channel Does not exist'));
    }

    const userProfile = user.UserProfile.filterFieldsFor({key: 'channel'});
    userProfile.followersCount = await UserFollowing.count({where: {toUserId: channelId}});

    return res.status(200).jsend.success({
      channel: getUserDetails(userProfile)
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

