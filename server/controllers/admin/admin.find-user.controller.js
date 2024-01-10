const logger = require('../../config/log4js')('admin-find-user');
const User = require('../../shared/database/models/user.model');

exports.findUser = async function (req, res, next, id) {
  try {
    const user = await User.findOne({where: {id}, include: User.includesForChannel});

    if (!user) {
      return res.status(404).jsend.fail(new Error('User does not exist'));

    }
    req.foundUser = user;
    next();
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

