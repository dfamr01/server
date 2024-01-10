const logger = require('../../config/log4js')('auth-sendToken-ctrl');
const AccessToken = require('../../shared/database/models/accessToken.model');
const {ACCESS_TOKEN_TYPES} = require('../../shared/config/constants');
const {generateToken} = require('../../shared/utils');
const {authToken} = require('../../config/config');

exports.sendToken = async function (req, res, next) {
  try {
    let userForToken = req.user.filterFieldsFor({key: 'token', flatten: true});

    const type = ACCESS_TOKEN_TYPES.AUTHENTICATION.key;
    let accessTokens = await req.user.getAccessTokens({where: {type}});
    logger.info(`Get previous ${ACCESS_TOKEN_TYPES.AUTHENTICATION.key} token`);
    await Promise.all(accessTokens.map((accessToken) => accessToken.destroy().catch(logger.error)));
    logger.info(`Destroy all previous ${ACCESS_TOKEN_TYPES.AUTHENTICATION.key} tokens`);

    const accessToken = await AccessToken.create({
      type,
      token: generateToken(userForToken),
      expireIn: authToken.expireIn,
      UserId: req.user.id
    });
    logger.info('Created auth token ', accessToken);

    return res.status(200).jsend.success({
      accessToken: {...accessToken.filterFieldsFor({key: 'get', flatten: true}), UserId: accessToken.UserId},
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

