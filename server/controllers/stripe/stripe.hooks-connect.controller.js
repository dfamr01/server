const logger = require('../../config/log4js')('stripe.hooks-connect');
const User = require('../../shared/database/models/user.model');
const {stripeSecretKey, stripeWebhookConnectSig} = require('../../config/config');
// eslint-disable-next-line import/order
const stripe = require('stripe')(stripeSecretKey);
const {validateAccount} = require('./stripe.account-check.controller');

const accountUpdate = 'account.updated';
const capabilityUpdate = 'capability.updated';

exports.hooksConnect = async function (req, res, next) {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookConnectSig);
    logger.info('✅ Success:', event.id, event.type);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const {type, account} = event;
  //console.log('webhook-account ✅ Success:', type, event);
  if (
    type === accountUpdate ||
    type === capabilityUpdate
  ) {
    const user = await User.findOne({
      where: {
        stripeAccountId: account
      }
    });

    //console.log('user', user);
    await validateAccount(user);
    res.json({received: true});
  }
};

