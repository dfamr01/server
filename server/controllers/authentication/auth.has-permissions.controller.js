const logger = require('../../config/log4js')('auth-hasPermissions-ctrl');
const User = require('../../shared/database/models/user.model');

exports.hasPermissions = function (requiredPermissions) {
  return function (req, res, next) {
    return next();
    /*
    const { user } = req;
    User
      .findById(user.id)
      .then((user) => {
        if (user && user.role === role) {
          return next();
        }

        logger.error('User is not authorized to view this content.');

        return res.status(401).jsend.fail(new Error('Unauthorized.'));
      })
      .catch(next);

    */
  };
};

exports.hasPermissions = function (req, res, next) {
  return next();
};
