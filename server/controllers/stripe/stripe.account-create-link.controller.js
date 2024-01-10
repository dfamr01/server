const logger = require('../../config/log4js')('stripe.account-create-link');
const {stripeSecretKey, appHost, protocol} = require('../../config/config');
// eslint-disable-next-line import/order
const stripe = require('stripe')(stripeSecretKey);

exports.accountCreateLink = async function (req, res, next) {
  const {user} = req;
  let accountLink = null;
  if (!user.stripeAccountId) {
    return res.status(404).jsend.fail(new Error('stripe account missing'), {error: 'stripeAccountMissing'});
  }
  try {
    accountLink = await stripe.accountLinks.create({
      type: 'account_onboarding',
      account: user.stripeAccountId,
      collect: 'eventually_due',
      refresh_url: `${protocol}://${appHost}/user-settings/creator-billing`,
      return_url: `${protocol}://${appHost}/user-settings/creator-billing`,
    });
  } catch (e) {
    logger.error(e);
    return res.status(404).jsend.fail(new Error('Could not create account'), {error: 'couldNotCreateLink'});
  }

  return res.status(200).jsend.success({
    stripeAccountLinkUrl: accountLink.url,
  });
};



