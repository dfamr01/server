const logger = require('../../config/log4js')('admin-get-payout');

exports.getPayout = function (req, res, next) {
  try {
    const {payout} = req;
    return res.status(200).jsend.success({
      user: payout.filterFieldsFor({key: 'get'}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

