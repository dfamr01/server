const logger = require('../../config/log4js')('following-find-ctrl');
const UserFollowing = require('../../shared/database/models/userFollowing.model');

exports.findFollowing = async function (req, res, next, id) {
  try {
    const {user} = req;
    const userFollowing = await UserFollowing.findOne({where: {id, UserId: user.id}});

    if (!userFollowing) {
      return res.status(404).jsend.fail(new Error('Following does not exist'));
    }

    req.userFollowing = userFollowing;
    next();
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

