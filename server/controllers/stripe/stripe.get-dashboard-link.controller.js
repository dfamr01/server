const logger = require('../../config/log4js')('stripe.get-dashboard-link');
const {stripeSecretKey} = require('../../config/config');

// eslint-disable-next-line import/order
const stripe = require('stripe')(stripeSecretKey);

exports.getDashboardLink = async function (req, res, next) {
  const {user} = req;

  if (!user.stripeAccountId) {
    return res.status(404).jsend.fail(new Error('Stripe account does not exist'), {error: 'stripeAccountNotExist'});
  }
  logger.info('user.stripeAccountId', user.stripeAccountId);
  return res.status(200).jsend.success({
    dashboardLink: await stripe.accounts.createLoginLink(user.stripeAccountId)
  });
};