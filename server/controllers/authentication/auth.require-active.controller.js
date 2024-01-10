const logger = require('../../config/log4js')('auth-require-active-ctrl');
const {USER_STATUS} = require('../../shared/config/constants');

exports.requireActive = function (req, res, next) {
  const {user} = req;
  if (user.status === USER_STATUS.DELETED.key) {
    return res.status(400).jsend.fail(new Error('User is deleted'), {error: 'userIsDeleted'});
  }
  return next();
};
