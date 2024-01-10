const logger = require('../../config/log4js')('payout-get-ctrl');

exports.payoutGet = async function (req, res, next) {
  try {
    const {payout} = req;
    return res.status(200).jsend.success({payout: payout.filterFieldsFor({key: 'get'})});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

