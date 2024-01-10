const logger = require('../../config/log4js')('auth-resetPassword-ctrl');

const {enqueueMail} = require('../../shared/helpers/mailer.help');
const {getUserFullName, getMailSignature} = require('../../shared/utils');

exports.resetPassword = async function (req, res, next) {
  try {
    const {accessToken, body} = req;
    const {password} = body;
    const user = accessToken.User;

    const userPasswordHistories = await user.getUserPasswordHistories();
    logger.info('got historical passwords');
    const matchingPassword = userPasswordHistories.find((userPassword) => userPassword.authenticate(password));
    logger.info('find a matching password');

    if (matchingPassword || user.authenticate(password)) {
      const errorMessage = 'You cannot use password you have used before!';
      logger.info(errorMessage);
      return res.status(401).jsend.fail(new Error(errorMessage));
    }

    await user.createUserPasswordHistory({
      UserId: user.id,
      password: user.password,
      passwordSalt: user.passwordSalt
    });
    logger.info('Created userPasswordHistory with the old password');

    user.password = password;
    await user.save();
    logger.info('Changed user password', user);

    await accessToken.destroy();
    logger.info('Token destroyed');

    const method = 'getChangedPasswordMailParams';
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
    await enqueueMail({params}).then(() => {
      logger.info('queue ChangedPasswordMailParams');
    });
    return req.login(user, next);
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};
