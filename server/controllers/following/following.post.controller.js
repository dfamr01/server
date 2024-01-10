const logger = require('../../config/log4js')('following-post-ctrl');
const UserFollowing = require('../../shared/database/models/userFollowing.model');

exports.postFollowing = async function (req, res, next) {
  try {
    const {user, body} = req;
    let {channelId} = body;
    logger.info('Creating a new following and event settings');
    const newFollowing = {
      UserId: user.id
    };

    if (!channelId) {
      return res.status(400).jsend.fail(new Error('Missing parameters, channelId is missing.'));
    }

    if (+channelId === user.id) {
      return res.status(400).jsend.fail(new Error('You cannot follow your own channel.'));
    }

    newFollowing.toUserId = channelId;

    const followingFound = await UserFollowing.findOne({where: newFollowing});
    if (followingFound) {
      return res.status(400).jsend.fail(new Error('Duplicate error, This following already exists'));
    }
    const userFollowing = await UserFollowing.create(newFollowing);
    logger.info('New following: ', userFollowing);

    return res.status(200).jsend.success({userFollowing});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

