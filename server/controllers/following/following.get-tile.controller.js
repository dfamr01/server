const logger = require('../../config/log4js')('following-get-tile-ctrl');
const UserFollowing = require('../../shared/database/models/userFollowing.model');
const User = require('../../shared/database/models/user.model');
const {getUserDetails} = require('../../shared/utils');

exports.getFollowingTile = async function (req, res, next) {
  try {
    const {user} = req;
    let {ids} = req.query;

    if (!ids || !ids.length) {
      return res.status(400).jsend.fail(new Error('Nothing to fetch'));
    }

    const l = ids.length;
    let i = 0;

    const followingsTile = [];

    for (i; i < l; i++) {
      const id = +ids[i];
      const following = await UserFollowing.findOne({where: {id, UserId: user.id}});
      if (!following) {
        return res.status(400).jsend.fail(new Error(`Following ${id} not found`));
      }

      const {toUserId} = following;
      const toUser = await User.findOne({where: {id: toUserId}, include: User.includesForChannel});

      if (!toUser) {
        return res.status(400).jsend.fail(new Error(`Channel ${toUserId} not found`));
      }

      toUser.UserProfile.followersCount = await UserFollowing.count({where: {toUserId}});

      followingsTile.push({
        followingId: id,
        ...getUserDetails(toUser.UserProfile) || {},
      });
    }

    return res.status(200).jsend.success({followingsTile});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

