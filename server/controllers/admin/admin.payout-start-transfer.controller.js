const logger = require('../../config/log4js')('payout-start-transfer-ctrl');
const sequelize = require('../../config/postgre/sequelizeConnection');
const {transferPayoutsBalance} = require('../../shared/helpers/payout.help');
const {PAYOUT_STATUS} = require('../../shared/config/constants');

exports.payoutStartTransfer = async function (req, res, next) {
  try {
    const {payout} = req;

    if (payout.status !== PAYOUT_STATUS.REQUESTED.key) {
      return res.status(404).jsend.fail(new Error('Payout transfer cannot be started'));
    }
    await sequelize.transaction(async (t) => {
      return res.status(200).jsend.success({
        payout: await transferPayoutsBalance({payout, t})
      });
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

