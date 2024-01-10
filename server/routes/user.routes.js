const express = require('express');
//  const logger = require('../config/log4js')('auth router');


const {requireLogin, requireActive} = require('../controllers/authentication');
const {
  getEager,
  update,
  get,
  getAllTransactions,
  getAllPurchases,
  getAccessControl,
  getRegistrations,
  getSettings,
  updateSettings,
  getProfile,
  updateProfile,
  updateAvatar,
  sendVerificationEmail,
} = require('../controllers/user');

const {uploadAvatar} = require('../shared/utils');

module.exports = function (apiRouter) {
  const userRouter = express.Router();

  // Path: /user
  apiRouter.use('/user', userRouter);

  userRouter.all('*', requireLogin, requireActive);

  // User
  // Path: /user
  // ==================================================
  userRouter.route('/')
    .get(get)
    .patch(update);

  // User
  // Path: /user/access-controls
  // ==================================================
  userRouter.route('/access-controls')
    .get(getAccessControl)

  // User
  // Path: /user/access-controls
  // ==================================================
  userRouter.route('/registrations')
    .get(getRegistrations)

  // User eager
  // Path: /user/eager/
  // ==================================================
  userRouter.route('/eager')
    .get(getEager);

  // Send verification email again
  // Path: /user/eager/
  userRouter.route('/send-verification-email')
    .get(sendVerificationEmail);

  // User Settings
  // Path: /user/settings/
  userRouter.route('/settings')
    .get(getSettings)
    .patch(updateSettings);

  // User profile
  // Path: /user/profile/
  userRouter.route('/profile')
    .get(getProfile)
    .patch(updateProfile);

  // User profile
  // Path: /user/profile/
  userRouter.route('/profile/avatar')
    .patch(uploadAvatar('avatar'), updateAvatar);

  // User
  // Path: /user/transactions
  // ==================================================
  userRouter.route('/transactions')
    .get(getAllTransactions);

  // User
  // Path: /user/purchases
  // ==================================================
  userRouter.route('/purchases')
    .get(getAllPurchases);

};
