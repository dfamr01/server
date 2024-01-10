const logger = require('../../config/log4js')('payout-request-transfer-ctrl');
const {PAYOUT_STATUS} = require('../../shared/config/constants')

exports.payoutRequestTransfer = async function (req, res, next) {
  try {
    const {payout} = req;
    payout.status = PAYOUT_STATUS.REQUESTED.key;
    await payout.save();
    return res.status(200).jsend.success({
      payout: payout.filterFieldsFor({key: 'get'}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

