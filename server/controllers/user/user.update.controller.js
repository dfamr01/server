const logger = require('../../config/log4js')('user-update-ctrl');
exports.update = function (req, res, next) {
  try {
    const {email, password, firstName, lastName} = req.body;

    return res.status(200).jsend.success({
      user: req.user.filterFieldsFor('userInfo', true),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

