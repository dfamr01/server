const logger = require('../../config/log4js')('user-sendVerificationEmail-ctrl');
const AccessToken = require('../../shared/database/models/accessToken.model');
const {enqueueMail} = require('../../shared/helpers/mailer.help');
const {ACCESS_TOKEN_TYPES} = require('../../shared/config/constants');
const {generateRandomToken, getUserFullName} = require('../../shared/utils');
const {emailVerificationToken} = require('../../config/config');

exports.sendVerificationEmail = async function (req, res, next) {
  try {
    const {user} = req.user;
    const type = ACCESS_TOKEN_TYPES.EMAIL_VERIFICATION.key;
    let accessTokens = await user.getAccessTokens({where: {type}});
    logger.info('Get previous email verification token');
    await Promise.all(accessTokens.map((accessToken) => accessToken.destroy().catch(logger.error)));
    logger.info('destroy previous all tokens');

    const token = generateRandomToken();
    await AccessToken.create({
      token, type,
      expireIn: emailVerificationToken.expireIn,
      UserId: user.id
    });
    logger.info('created new token');

    const params = {
      method: 'getEmailVerificationParams',
      rawParams: {
        to: user.email,
        fullName: getUserFullName(user.UserProfile),
        token
      }
    };
    enqueueMail(params).then(() => {
      logger.info('queue email verification');
    });

    logger.info('Created new verification email');
    return res.status(200).jsend.success({success: true});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};
