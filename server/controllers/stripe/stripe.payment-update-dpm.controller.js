const logger = require('../../config/log4js')('stripe.payment-update-dpm');

exports.paymentUpdateDpm = async function (req, res, next) {
  try {
    const {user, body} = req;

    let {stripeCustomerDPM} = body;
    if (!stripeCustomerDPM) {
      return res.status(404).jsend.fail(new Error('Missing parameter: `stripeCustomerDPM`'), {error: 'missingParameters'});
    }
    user.stripeCustomerDPM = stripeCustomerDPM;
    await user.save();

    return res.status(200).jsend.success({success: true});
  } catch (err) {
    return res.status(500).jsend.fail(err);
  }
};

