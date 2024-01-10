const logger = require('../../config/log4js')('favorite-find-ctrl');
const UserFavorite = require('../../shared/database/models/userFavorite.model');

exports.findFavorite = async function (req, res, next, id) {
  try {
    const {user} = req;
    const userFavorite = await UserFavorite.findOne({where: {id, UserId: user.id}});

    if (!userFavorite) {
      return res.status(404).jsend.fail(new Error('Favorite does not exist'));
    }

    req.userFavorite = userFavorite;
    next();
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

