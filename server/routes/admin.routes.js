const express = require('express');
//  const logger = require('../config/log4js')('auth router');

const {requireLogin, requireActive} = require('../controllers/authentication');
const {
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
} = require('../controllers/admin');

const {
  isAnAdmin
} = require('../shared/permissions/middleware/security');

module.exports = function (apiRouter) {
  const userRouter = express.Router();

  // Path: /user
  apiRouter.use('/admin', userRouter);

  userRouter.all('*', requireLogin, isAnAdmin, requireActive);

  // admin
  // Path: /admin/all-events
  // ==================================================
  userRouter.route('/all-events')
    .get(getAllEvents);

  // Path: /admin/event/:eventId
  // ==================================================
  userRouter.route('/event/:eventId')
    .get(getEvent)
    .patch(updateEvent)
    .delete(deleteEvent);

  // Path: /admin/all-payouts
  // ==================================================
  userRouter.route('/all-payouts')
    .get(getAllPayouts);

  // Path: /admin/payout/:payoutId
  // ==================================================
  userRouter.route('/payout/:payoutId')
    .get(getPayout)
    .patch(updatePayout)
    .delete(deletePayout);

  // Payout
  // Path: /admin/payout/:payoutId/start-transfer
  // ==================================================
  userRouter.route('/payout/:payoutId/start-transfer')
    .post(payoutStartTransfer);

  // Path: /admin/all-users
  // ==================================================
  userRouter.route('/all-users')
    .get(getAllUsers);

  // Path: /admin/user/:userId
  // ==================================================
  userRouter.route('/user/:userId')
    .get(getUser)
    .patch(updateUser)
    .delete(deleteUser);


  // Path: /admin/all-workshops
  // ==================================================
  userRouter.route('/all-workshops')
    .get(getAllWorkshops);

  // Path: /admin/workshop/:workshopId
  // ==================================================
  userRouter.route('/workshop/:workshopId')
    .get(getWorkshop)
    .patch(updateWorkshop)
    .delete(deleteWorkshop);

  userRouter.param('eventId', findEvent);
  userRouter.param('payoutId', findPayout);
  userRouter.param('userId', findUser);
  userRouter.param('workshopId', findWorkshop);
};
