const logger = require('../../config/log4js')('payout-get-all-ctrl');
const Payout = require('../../shared/database/models/payout.model');

exports.payoutGetAll = async function (req, res, next) {
  try {
    const options = {
      where: {
        UserId: req.user.id,
      }
    };
    const payouts = await Payout.findAll(options);

    return res.status(200).jsend.success({
      payouts: payouts.map((payout) => payout.filterFieldsFor({key: 'get'})),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

