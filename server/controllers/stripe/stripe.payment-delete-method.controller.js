const logger = require('../../config/log4js')('stripe.payment-delete-method');
const {stripeSecretKey} = require('../../config/config');

// eslint-disable-next-line import/order
const stripe = require('stripe')(stripeSecretKey);


exports.paymentDeleteMethod = async function (req, res, next) {
  try {
    const {user, params} = req;
    const {paymentMethodId} = params;

    if (!user.stripeCustomerId) {
      return res.status(404).jsend.fail(new Error('Stripe customerId does not exist'), {error: 'stripeCustomerNotExist'});
    }

    if (!paymentMethodId) {
      return res.status(404).jsend.fail(new Error('Payment method is required'), {error: 'stripeNoPaymentMethodId'});
    }

    await stripe.paymentMethods.detach(paymentMethodId);
    return res.status(200).jsend.success({success: true});
  } catch (err) {
    return res.status(500).jsend.fail(err);
  }
};