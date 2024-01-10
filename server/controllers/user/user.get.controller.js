const logger = require('../../config/log4js')('user-get-ctrl');

exports.get = function (req, res, next) {
  try {
    return res.status(200).jsend.success({
      user: req.user.filterFieldsFor({key: 'get', rootOnly: true}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

