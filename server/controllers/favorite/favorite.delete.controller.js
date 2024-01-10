const logger = require('../../config/log4js')('favorite-delete-ctrl');

exports.deleteFavorite = async function (req, res, next) {
  try {
    const {user, userFavorite} = req;
    const result = await userFavorite.destroy();
    return res.status(200).jsend.success({res: true});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

