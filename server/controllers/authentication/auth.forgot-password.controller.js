const logger = require('../../config/log4js')('auth-forgotPassword-ctrl');
const User = require('../../shared/database/models/user.model');
const AccessToken = require('../../shared/database/models/accessToken.model');
const {ACCESS_TOKEN_TYPES} = require('../../shared/config/constants');
const {enqueueMail} = require('../../shared/helpers/mailer.help');
const {resetPasswordToken} = require('../../config/config');
const {generateRandomToken, getUserFullName, getMailSignature} = require('../../shared/utils');

exports.forgotPassword = async function (req, res, next) {
  try {
    let {email} = req.body;
    email = email && email.toLowerCase() || null;
    const invalidEmailError = new Error(`Something went wrong, try again.`);
    const user = await User.findOne({where: {email}, include: ['UserProfile']});
    if (!user) {
      logger.error(invalidEmailError);
      return res.status(422).jsend.fail(invalidEmailError);
    }

    if (user.provider !== 'local') {
      logger.error(`User: ${user.email} signed up with social media.`);
      return res.status(422).jsend.fail(new Error('User signed up with social media.'));
    }

    const type = ACCESS_TOKEN_TYPES.RESET_PASSWORD.key;
    let accessTokens = await user.getAccessTokens({where: {type}});
    logger.info('Get previous email verification token');
    accessTokens[0] && await accessTokens[0].destroy();
    logger.info('destroy previous token');

    const token = generateRandomToken();
    await AccessToken.create({
      token, type,
      expireIn: resetPasswordToken.expireIn,
      UserId: user.id
    });
    logger.info('AccessToken created successfully');

    const method = 'getForgotPasswordMailParams';
    const params = {
      signature: getMailSignature({
        email,
        method,
      }),
      method,
      rawParams: {
        to: user.email,
        fullName: getUserFullName(user.UserProfile),
        token
      }
    };
    await enqueueMail({params}).then(() => {
      logger.info('queue ForgotPasswordMailParams');
    });
    return res.status(200).jsend.success({
      title: 'Password Link Sent!',
      message: 'Please check your email for the link to reset your password!',
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};
