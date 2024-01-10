const logger = require('../../config/log4js')('stripe.account-check');
const {stripeSecretKey} = require('../../config/config');

// eslint-disable-next-line import/order
const stripe = require('stripe')(stripeSecretKey);

const {USER_STRIPE_ACCOUNT_STATUS} = require('../../shared/config/constants');
const {accountIsValid} = require('../../shared/utils/stripe.utils');


exports.validateAccount = async function (user) {
  if (!user) {
    throw new Error('User is missing');
  }
  const {PENDING, VERIFIED} = USER_STRIPE_ACCOUNT_STATUS;
  const account = await stripe.accounts.retrieve(user.stripeAccountId);
  user.stripeAccountStatus = accountIsValid(account) ? VERIFIED.key : PENDING.key;
  return user.save();
};

exports.accountCheck = async function (req, res, next) {
  const {user} = req;

  if (!user.stripeAccountId) {
    return res.status(404).jsend.fail(new Error('Stripe account does not exist'), {error: 'stripeAccountNotExist'});
  }

  try {
    await exports.validateAccount(user);
  } catch (e) {
    return res.status(404).jsend.fail(new Error('could not check account'), {error: 'couldNotCheckAccount'});
  }

  return res.status(200).jsend.success({
    stripeAccountId: user.stripeAccountId,
    stripeAccountStatus: user.stripeAccountStatus
  });
};

