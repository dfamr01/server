const logger = require('../../config/log4js')('payout-generate-ctrl');
const sequelize = require('../../config/postgre/sequelizeConnection');
const {generatePayoutsForCreator} = require('../../shared/helpers/payout.help');

exports.payoutGenerate = async function (req, res, next) {
  try {
    await sequelize.transaction(async (t) => {
      if (!req.user.stripeAccountId) {
        return res.status(404).jsend.fail(new Error('Cannot generate payouts you are not connected with stripe.'));
      }
      const generatedPayouts = await generatePayoutsForCreator({creator: req.user, t});
      return res.status(200).jsend.success({
        payouts: generatedPayouts.map((payout) => payout.filterFieldsFor({key: 'get'})),
      });
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

