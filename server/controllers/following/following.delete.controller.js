const logger = require('../../config/log4js')('following-delete-ctrl');

exports.deleteFollowing = async function (req, res, next) {
  try {
    const {user, userFollowing} = req;
    const result = await userFollowing.destroy();
    return res.status(200).jsend.success({res: true});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

