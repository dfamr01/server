const logger = require('../../config/log4js')('following-get-count-ctrl');
const UserFollowing = require('../../shared/database/models/userFollowing.model');

exports.getFollowingsCount = async function (req, res, next) {
  try {
    const {user, query} = req;
    let {channelId} = query;

    if (!channelId) {
      return res.status(404).jsend.fail(new Error('Channel id is missing'));
    }

    return res.status(200).jsend.success({
      followersCount: await UserFollowing.count({where: {toUserId: channelId}})
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

