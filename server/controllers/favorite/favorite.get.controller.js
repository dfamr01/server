const logger = require('../../config/log4js')('favorite-get-ctrl');

exports.getFavorite = async function (req, res, next) {
  try {
    const {userFavorite} = req;
    return res.status(200).jsend.success({userFavorite});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

