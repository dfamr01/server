const express = require('express');
const {requireLogin, requireActive} = require('../controllers/authentication');

const {
  authUser,
  deleteMeeting,
  getMeeting,
  getUserZak,
  postMeeting,
  refreshUserToken,
  signature,
  updateMeeting
} = require('../controllers/zoom');

module.exports = function (apiRouter) {
  const userRouter = express.Router();

  // Path: /user
  apiRouter.use('/zoom', userRouter);

  userRouter.all('*', requireLogin, requireActive);


  // retrieve signature
  // Path: /zoom/signature
  // ==================================================
  userRouter.route('/signature')
    .post(signature);

  // retrieve user ZAK
  // Path: /zoom/user-zak
  // ==================================================
  userRouter.route('/user-zak')
    .get(getUserZak);


  // authenticate zoom user
  // Path: /zoom/auth-zoom-user
  // ==================================================
  userRouter.route('/auth-zoom-user')
    .post(authUser);

  // refresh zoom user token
  // Path: /zoom/refresh-zoom-user-token
  // ==================================================
  userRouter.route('/refresh-zoom-user-token')
    .post(refreshUserToken);


  // Meeting
  // Path: /zoom/meeting
  // ==================================================
  userRouter.route('/meeting')
    .post(postMeeting);

  // Path: /zoom/meeting/:meetingId
  // ==================================================
  userRouter.route('/meeting/:meetingId')
    .get(getMeeting)
    .patch(updateMeeting)
    .delete(deleteMeeting);

};
