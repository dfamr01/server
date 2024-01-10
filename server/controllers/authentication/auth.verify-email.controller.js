const logger = require('../../config/log4js')('user-verifyEmail-ctrl');

const {enqueueMail} = require('../../shared/helpers/mailer.help');
const {USER_STATUS} = require('../../shared/config/constants');
const {getUserFullName, getMailSignature} = require('../../shared/utils');

exports.verifyEmail = async function (req, res, next) {
  try {
    const {accessToken} = req;
    const user = accessToken.User;
    user.status = USER_STATUS.VERIFIED.key;
    await user.save();
    logger.info('Updated user status');
    await accessToken.destroy();
    logger.info('Destroyed access token');

    const method = 'getThankForVerificationParams';
    const params = {
      signature: getMailSignature({
        email: user.email,
        method,
      }),
      method,
      rawParams: {
        to: user.email,
        fullName: getUserFullName(user.UserProfile)
      }
    };
    enqueueMail({params}).then(() => {
      logger.info('queue ThankForVerificationParams');
    });
    return req.login(user, next);
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};
