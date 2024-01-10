const moment = require('moment');
const logger = require('../../config/log4js')('auth-findAccessToken-ctrl');
const AccessToken = require('../../shared/database/models/accessToken.model');
const User = require('../../shared/database/models/user.model');

exports.findAccessToken = async function (req, res, next, token) {
  try {
    const accessToken = await AccessToken.findOne({
      where: {token},
      include: {
        model: User,
        include: ['UserProfile'],
      }
    });

    logger.info('Found access token: ', accessToken);
    if (!accessToken) {
      const errorMessage = 'Token was not found';
      logger.info(errorMessage);
      return res.status(401).jsend.fail(new Error(errorMessage));
    }

    const {updatedAt, expireIn} = accessToken;
    const expireDate = moment(updatedAt).add(expireIn, 'seconds');
    if (moment().diff(expireDate, 'seconds') > 0) {
      accessToken.destroy();
      const errorMessage = 'Token has expired';
      logger.info(errorMessage);
      return res.status(401).jsend.fail(new Error(errorMessage));
    }
    logger.info('Found accessToken', accessToken);
    req.accessToken = accessToken;
    next();
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};
