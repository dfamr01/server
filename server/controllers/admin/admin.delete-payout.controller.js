const logger = require('../../config/log4js')('admin-delete-payout');

exports.deletePayout = async function (req, res, next) {
  try {
    const {payout} = req;
    await payout.destroy();
    return res.status(200).jsend.success({success: true});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

