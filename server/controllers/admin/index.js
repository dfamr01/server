const {findEvent} = require('./admin.find-event.controller');
const {findPayout} = require('./admin.find-payout.controller');
const {findUser} = require('./admin.find-user.controller');
const {findWorkshop} = require('./admin.find-workshop.controller');
const {getAllEvents} = require('./admin.get-all-event.controller');
const {getAllPayouts} = require('./admin.get-all-payouts.controller');
const {getAllUsers} = require('./admin.get-all-users.controller');
const {getAllWorkshops} = require('./admin.get-all-workshops.controller');
const {getEvent} = require('./admin.get-event.controller');
const {getPayout} = require('./admin.get-payout.controller');
const {getUser} = require('./admin.get-user.controller');
const {getWorkshop} = require('./admin.get-workshop.controller');
const {payoutStartTransfer} = require('./admin.payout-start-transfer.controller');
const {updateEvent} = require('./admin.update-event.controller');
const {updatePayout} = require('./admin.update-payout.controller');
const {updateUser} = require('./admin.update-user.controller');
const {updateWorkshop} = require('./admin.update-workshop.controller');
const {deleteEvent} = require('./admin.delete-event.controller');
const {deletePayout} = require('./admin.delete-payout.controller');
const {deleteUser} = require('./admin.delete-user.controller');
const {deleteWorkshop} = require('./admin.delete-workshop.controller');

module.exports = {
  findEvent,
  findPayout,
  findUser,
  findWorkshop,
  getAllEvents,
  getAllPayouts,
  getAllUsers,
  getAllWorkshops,
  getEvent,
  getPayout,
  getUser,
  getWorkshop,
  payoutStartTransfer,
  updateEvent,
  updatePayout,
  updateUser,
  updateWorkshop,
  deleteEvent,
  deletePayout,
  deleteUser,
  deleteWorkshop
};
