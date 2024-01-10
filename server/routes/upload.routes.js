const express = require('express');
//  const logger = require('../config/log4js')('auth router');


const {
  requireLogin,
  requireActive
} = require('../controllers/authentication');

const {canGetSignedUrl} = require('../shared/permissions/middleware/upload');

const {
  uploadDelete,
  uploadFind,
  uploadGet,
  uploadPatch,
  uploadPost,
  uploadGetSignedUrl,
  uploadVideo,
  uploadChunkedVideo,
  uploadChunkedVideoCheck,
  uploadChunkedVideoStart,
  uploadChunkedVideoStarted,
  uploadChunkedVideoAbort
} = require('../controllers/upload');

module.exports = function (apiRouter) {
  const userRouter = express.Router();

  // Path: /user
  apiRouter.use('/upload', userRouter);

  userRouter.all('*', requireLogin, requireActive);

  userRouter.route('/')
    .post(uploadPost);// ACL Done inside the controller - only owner or admins.

  //userRouter.route('/:uploadId')
  //.get(uploadGet) // only owner or admin // user who bought the event/workshop - not used(remove)
  //.patch(uploadPatch) // only owner or admin of the event/workshop/channel can patch new video - not used(remove)
  //.delete(uploadDelete); // only owner or admin of the event/workshop/channel can delete new video - not used(remove)


  userRouter.route('/:uploadId/signed-url')
    .get(canGetSignedUrl, uploadGetSignedUrl); // only owner or admin // user who bought the event/workshop

  userRouter.route('/video')
    .post(uploadVideo);// ACL Done inside the controller - only owner or admins.

  userRouter.route('/chunked/video/start')
    .post(uploadChunkedVideoStart);// ACL Done inside the controller - only owner or admins.

  userRouter.route('/chunked/video/started')
    .get(uploadChunkedVideoStarted);// ACL Done inside the controller - only owner or admins.

  userRouter.route('/chunked/video/abort')
    .post(uploadChunkedVideoAbort);// ACL Done inside the controller - only owner or admins.

  userRouter.route('/chunked/video')
    .post(uploadChunkedVideo) // ACL Done inside the controller - only owner or admins.
    .get(uploadChunkedVideoCheck); // ACL Done inside the controller - only owner or admins.


  userRouter.param('uploadId', uploadFind);
};
