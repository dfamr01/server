const logger = require('../../config/log4js')('following-get-ctrl');

exports.getFollowing = async function (req, res, next) {
  try {
    const {userFollowing} = req;
    return res.status(200).jsend.success({userFollowing});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

