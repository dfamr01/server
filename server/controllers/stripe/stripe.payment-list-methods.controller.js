const logger = require('../../config/log4js')('stripe.payment-list-methods');
const {getPaymentMethods} = require('../../shared/helpers/stripe-get-payment-methods.help');

exports.paymentListMethods = async function (req, res, next) {
  try {
    const {user} = req;

    if (!user.stripeCustomerId) {
      return res.status(404).jsend.fail(new Error('Stripe customerId does not exist'), {error: 'stripeCustomerNotExist'});
    }

    return res.status(200).jsend.success({
      paymentMethods: await getPaymentMethods(user.stripeCustomerId)
    });
  } catch (err) {
    return res.status(500).jsend.fail(err);
  }
};