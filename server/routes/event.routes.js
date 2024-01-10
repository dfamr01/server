const express = require('express');

const {requireLogin, optionalLogin, requireActive} = require('../controllers/authentication');
const {
  find,
  get,
  getEager,
  getAll,
  getAllUpcoming,
  getContainer,
  start,
  complete,
  update,
  updatePrivacy,
  updateVisibility,
  eventDelete,

  getRating,

  getSettings,
  updateSettings,

  getOccurrences,

  getOccurrence,
  postOccurrence,
  updateOccurrence,
  deleteOccurrence,

  findRegistration,
  getRegistration,
  getAllRegistration,
  postRegistration,
  deleteRegistration,

  updateCoverPhoto,
  eventRequireActive
} = require('../controllers/event');

const {uploadAvatar} = require('../shared/utils');

const {
  canDeleteRegistration,
  canGetAll,
  canGetRegistration,
  canPostRegistration,
  canStart,
  canView,
  canViewOccurrence,
  isAdminOrOwner,
  optionalAdminView
} = require('../shared/permissions/middleware/event');

module.exports = function (apiRouter) {
  const userRouter = express.Router();

  // Path: /user
  apiRouter.use('/event', userRouter);

  // INSECURE ROUTES

  // Event post
  // Path: /event/all
  // ==================================================
  userRouter.route('/all')
    .post(optionalLogin, canGetAll, getAll);

  // Workshop
  // Path: /event/:eventId
  // ==================================================
  userRouter.route('/:eventId/container')
    .get(optionalLogin, optionalAdminView, getContainer);

  // Event start
  // Path: /event/:eventId/rating
  // ==================================================
  userRouter.route('/:eventId/rating')
    .get(getRating);

  // SECURE ROUTES
  userRouter.all('*', requireLogin, requireActive);

  // Event post
  // Path: /event
  // ==================================================
  /*
  userRouter.route('/')
    .post(post);
  */

  // Event start
  // Path: /event
  // ==================================================
  userRouter.route('/start')
    .post(canStart, start);// admin or owner

  // Event Registration
  // Get all the registrations done by a user
  // Path: /allRegistration
  // ==================================================
  userRouter.route('/all-registration')
    .get(getAllRegistration);// everyone can get their own

  // Event upcoming
  // Path: /get-all-upcoming/
  userRouter.route('/get-all-upcoming')
    .post(getAllUpcoming);

  // Event complete
  // Path: /event
  // ==================================================
  userRouter.route('/:eventId/complete')
    .post(eventRequireActive, isAdminOrOwner, complete);// admin or owner

  // Event
  // Path: /event/:eventId
  // ==================================================
  userRouter.route('/:eventId')
    .get(eventRequireActive, canView, get)// admin or owner && someone that has access to the event
    .patch(eventRequireActive, isAdminOrOwner, update)// admin or owner
    .delete(eventRequireActive, isAdminOrOwner, eventDelete);// admin or owner

  // Update event's privacy
  // Path: /event/:eventId/privacy
  // ==================================================
  userRouter.route('/:eventId/privacy')
    .patch(eventRequireActive, isAdminOrOwner, updatePrivacy);// admin or owner

  // Update event's visibility
  // Path: /event/:eventId/visibility
  // ==================================================
  userRouter.route('/:eventId/visibility')
    .patch(eventRequireActive, isAdminOrOwner, updateVisibility);// admin or owner

  userRouter.route('/:eventId/cover-photo')
    .patch(eventRequireActive, isAdminOrOwner, uploadAvatar('coverPhoto'), updateCoverPhoto);// admin or owner

  // Event
  // Path: /event/:eventId/eager
  // ==================================================
  userRouter.route('/:eventId/eager')
    .get(eventRequireActive, isAdminOrOwner, getEager);// admin or owner

  // Event
  // Path: /event/:eventId/settings
  // ==================================================
  userRouter.route('/:eventId/settings')
    .get(eventRequireActive, canView, getSettings)// admin or owner and whoever have access to the event
    .patch(eventRequireActive, isAdminOrOwner, updateSettings);// admin or owner


  // Event Occurrences
  // Path: /event/:eventId/occurrence
  // ==================================================
  userRouter.route('/:eventId/occurrence')
    .get(eventRequireActive, isAdminOrOwner, getOccurrences)// admin or owner
    .post(eventRequireActive, isAdminOrOwner, postOccurrence);// admin or owner

  // Event Occurrences
  // Path: /event/:eventId/occurrence/:occurrenceId
  // ==================================================
  userRouter.route('/:eventId/occurrence/:occurrenceId')
    .get(eventRequireActive, canViewOccurrence, getOccurrence)// admin or owner and whoever have access to the event/occurrence
    .patch(eventRequireActive, isAdminOrOwner, updateOccurrence)// admin or owner
    .delete(eventRequireActive, isAdminOrOwner, deleteOccurrence);// admin or owner


  // Event Registration
  // Path: /:eventId/occurrence/:occurrenceId/registration
  // ==================================================
  userRouter.route('/:eventId/occurrence/:occurrenceId/registration')
    .get(eventRequireActive, isAdminOrOwner, getRegistration)// Admin or owner of the event can get all the people who registered to that occurrence
    .post(eventRequireActive, canPostRegistration, postRegistration);// can be done by anyone with access to the event  - tested

  // Event Registration
  // Path: /:eventId/registration
  // ==================================================
  userRouter.route('/:eventId/registration')
    .get(eventRequireActive, canGetRegistration, getRegistration);// everyone can get their own. admins/owners only if adminView is on for that event.


  // Event Registration
  // Path: /:eventId/registration/:registrationId
  // ==================================================
  userRouter.route('/:eventId/registration/:registrationId')
    .get(eventRequireActive, canGetRegistration, getRegistration)// everyone can get their own. admins/owners only if adminView is on for that event.
    .delete(eventRequireActive, canDeleteRegistration, deleteRegistration);// admin or owner of the registration or admin/owner of the event - tested

  userRouter.param('eventId', find);
  userRouter.param('registrationId', findRegistration);
};
