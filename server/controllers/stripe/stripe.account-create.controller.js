const moment = require('moment');
const logger = require('../../config/log4js')('stripe.account-create');
const {stripeSecretKey} = require('../../config/config');
// eslint-disable-next-line import/order
const stripe = require('stripe')(stripeSecretKey);

const {USER_STRIPE_ACCOUNT_STATUS} = require('../../shared/config/constants');

exports.accountCreate = async function (req, res, next) {
  const {user} = req;
  const userProfile = await user.getUserProfile();
  const individual = {
    email: user.email,
    first_name: userProfile.firstName,
    last_name: userProfile.lastName,
  };

  if (userProfile.dateOfBirth) {
    const dob = moment(userProfile.dateOfBirth);
    individual.dob = {
      day: +dob.format('D'),
      month: +dob.format('M'),
      year: +dob.format('Y'),
    };
  }

  if (userProfile.mobilePhoneNumber) {
    individual.phone = userProfile.mobilePhoneNumber;
  }

  let account = null;
  try {
    account = await stripe.accounts.create({
      type: 'express',
      business_type: 'individual',
      email: user.email,
      /*
      capabilities: {
        card_payments: {
          requested: true,
        },
        transfers: {
          requested: true,
        },
      },
      */
      individual
    });
    //console.log('account', account);
    user.stripeAccountId = account.id;
    user.stripeAccountStatus = USER_STRIPE_ACCOUNT_STATUS.PENDING.key;
    await user.save();
  } catch (e) {
    return res.status(400).jsend.fail(e, {error: 'couldNotCreateLink'});
  }

  return res.status(200).jsend.success({
    stripeAccountId: account.id,
    stripeAccountStatus: USER_STRIPE_ACCOUNT_STATUS.PENDING.key
  });
};

