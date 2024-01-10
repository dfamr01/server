const express = require('express');
//const logger = require('../config/log4js')('auth router');


const {requireLogin, optionalLogin, requireActive} = require('../controllers/authentication');
const {
  find,
  get,
  getContainer,
  getEager,
  getAll,
  getAllUpcoming,

  start,
  complete,
  post,
  update,
  updatePrivacy,
  updateVisibility,
  workshopDelete,

  getRating,

  getSettings,
  updateSettings,

  findRegistration,
  getRegistration,
  getAllRegistration,
  postRegistration,
  deleteRegistration,

  updateCoverPhoto,
  workshopRequireActive
} = require('../controllers/workshop');

const {uploadAvatar} = require('../shared/utils');

const {
  canDeleteRegistration,
  canGetAll,
  canGetRegistration,
  canPostRegistration,
  canStart,
  isAdminOrOwner,
  optionalAdminView
} = require('../shared/permissions/middleware/workshop');

module.exports = function (apiRouter) {
  const userRouter = express.Router();

  // Path: /user
  apiRouter.use('/workshop', userRouter);

  // INSECURE ROUTES

  // Workshop
  // Path: /workshop/:workshopId
  // ==================================================
  userRouter.route('/:workshopId/container')
    .get(optionalLogin, optionalAdminView, getContainer);

  // Workshop post
  // Path: /workshop/all
  // ==================================================
  userRouter.route('/all')
    .post(optionalLogin, canGetAll, getAll);

  // Workshop get rating
  // Path: /workshop/:workshopId/rating
  // ==================================================
  userRouter.route('/:workshopId/rating')
    .get(getRating);


  // SECURE ROUTES
  userRouter.all('*', requireLogin, requireActive);

  // todo: make sure that every request is checked for permission because workshop.find currently allow any user to get any workshop

  // Workshop post
  // Path: /workshop
  // ==================================================
  //userRouter.route('/')
  //.post(canPost, post);// admin or owner

  // Workshop start
  // Path: /workshop
  // ==================================================
  userRouter.route('/start')
    .post(canStart, start);// admin or owner - tested

  // Workshop Registration
  // GGet all the registration a user done
  // Path: /allRegistration
  // ==================================================
  userRouter.route('/all-registration')
    .get(getAllRegistration);// everyone can get their own

  // Workshop upcoming
  // Path: /get-all-upcoming/
  userRouter.route('/get-all-upcoming')
    .post(getAllUpcoming);

  // Workshop complete
  // Path: /workshop
  // ==================================================
  userRouter.route('/:workshopId/complete')
    .post(workshopRequireActive, isAdminOrOwner, complete);// admin or owner - tested

  // Workshop
  // Path: /workshop/:workshopId
  // ==================================================
  userRouter.route('/:workshopId')
    .get(workshopRequireActive, get)// anyone
    .patch(workshopRequireActive, isAdminOrOwner, update)// admin or owner - tested
    .delete(workshopRequireActive, isAdminOrOwner, workshopDelete);// admin or owner - tested

  // Update workshop's privacy
  // Path: /workshop/:workshopId/privacy
  // ==================================================
  userRouter.route('/:workshopId/privacy')
    .patch(workshopRequireActive, isAdminOrOwner, updatePrivacy);// admin or owner  - tested


  // Update workshop's visibility
  // Path: /workshop/:workshopId/visibility
  // ==================================================
  userRouter.route('/:workshopId/visibility')
    .patch(workshopRequireActive, isAdminOrOwner, updateVisibility);// admin or owner  - tested


  userRouter.route('/:workshopId/cover-photo')
    .patch(workshopRequireActive, isAdminOrOwner, uploadAvatar('coverPhoto'), updateCoverPhoto);// admin or owner - tested

  // Workshop
  // Path: /workshop/:workshopId/eager
  // ==================================================
  userRouter.route('/:workshopId/eager')
    .get(workshopRequireActive, isAdminOrOwner, getEager);// anyone

  // Workshop
  // Path: /workshop/:workshopId/settings
  // ==================================================
  userRouter.route('/:workshopId/settings')
    .get(workshopRequireActive, getSettings)// anyone
    .patch(workshopRequireActive, isAdminOrOwner, updateSettings);// admin or owner - tested


  // Workshop Registration
  // Path: /:workshopId/registration
  // ==================================================
  userRouter.route('/:workshopId/registration')
    .get(workshopRequireActive, canGetRegistration, getRegistration) // everyone can get their own. admins/owners only if adminView is on for that workshop.
    .post(workshopRequireActive, canPostRegistration, postRegistration); // can be done by anyone with access to the workshop  - tested

  // Workshop Registration
  // Path: /:workshopId/registration/:registrationId
  // ==================================================
  userRouter.route('/:workshopId/registration/:registrationId')
    .get(workshopRequireActive, canGetRegistration, getRegistration)// everyone can get their own. admins/owners only if adminView is on for that workshop.
    .delete(workshopRequireActive, canDeleteRegistration, deleteRegistration);// admin or owner of the registration or admin/owner of the workshop - tested


  userRouter.param('workshopId', find);
  userRouter.param('registrationId', findRegistration);
};
