const {get} = require('./user.get.controller');
const {getAll} = require('./user.get-all.controller');
const {getAllTransactions} = require('./user.get-all-transactions.controller');
const {getAllPurchases} = require('./user.get-all-purchases.controller');
const {getAccessControl} = require('./user.get-access-controls.controller');
const {getRegistrations} = require('./user.get-registrations.controller');
const {update} = require('./user.update.controller');
const {getEager} = require('./user.get-eager.controller');
const {getSettings} = require('./user.get-settings.controller');
const {updateSettings} = require('./user.update-settings.controller');
const {getProfile} = require('./user.get-profile.controller');
const {updateProfile} = require('./user.update-profile.controller');
const {updateAvatar} = require('./user.update-avatar.controller');

const {sendVerificationEmail} = require('./user.send-verification-email.controller');

module.exports = {
  get,
  getAll,
  getAllTransactions,
  getAllPurchases,
  getAccessControl,
  getRegistrations,
  update,
  getEager,
  getSettings,
  updateSettings,
  getProfile,
  updateProfile,
  updateAvatar,
  sendVerificationEmail,
};
