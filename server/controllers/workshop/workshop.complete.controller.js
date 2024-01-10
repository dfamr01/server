const logger = require('../../config/log4js')('workshop-complete-ctrl');
const {validateWorkshopDetails, parseErrors, isPaid} = require('../../shared/utils');
const {WORKSHOP_STATUS, USER_STRIPE_ACCOUNT_STATUS} = require('../../shared/config/constants');
const {CONNECT_TO_STRIPE, FINISH_STRIPE_ACCOUNT, MISSING_PARAMS} = require('../../shared/config/errors');
const {hasMinimumPriceError} = require("../../shared/utils/event.utils");

exports.complete = async function (req, res, next) {
  try {
    const {workshop, user} = req;

    if (isPaid(workshop.paymentType)) {
      if (!user.stripeAccountId) {
        return res.status(401).jsend.fail(new Error('Please connect to stripe first'), {error: CONNECT_TO_STRIPE});
      }

      if (user.stripeAccountStatus !== USER_STRIPE_ACCOUNT_STATUS.VERIFIED.key) {
        return res.status(401).jsend.fail(new Error('Please finish verify your Stripe account'), {error: FINISH_STRIPE_ACCOUNT});
      }
    }

    const errors = validateWorkshopDetails(workshop, user.id, user.AccessControls);
    if (Object.keys(errors).length) {
      return res.status(400).jsend.fail(new Error(parseErrors(errors, 'please fix the above issues\n')), errors);
    }

    const userSettings = await user.getUserSetting();

    const minimumPriceError = hasMinimumPriceError(workshop.price, workshop.paymentType, userSettings.currency)
    if (minimumPriceError) {
      return res.status(400).jsend.fail(new Error(minimumPriceError), {error: MISSING_PARAMS});
    }

    if (workshop.status === WORKSHOP_STATUS.STARTED.key) {
      workshop.status = WORKSHOP_STATUS.COMPLETED.key;
    }
    workshop.currency = userSettings.currency;
    const updatedWorkshop = await workshop.save();

    return res.status(200).jsend.success({
      workshop: updatedWorkshop.filterFieldsFor({key: 'get'}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

