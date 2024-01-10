const {uploadDelete} = require('./upload.delete.controller');
const {uploadFind} = require('./upload.find.controller');
const {uploadGet} = require('./upload.get.controller');
const {uploadPatch} = require('./upload.patch.controller');
const {uploadPost} = require('./upload.post.controller');
const {uploadGetSignedUrl} = require('./upload.get-signed-url.controller');
const {uploadVideo} = require('./upload.video.controller');
const {uploadChunkedVideo} = require('./upload.chunked-video.controller');
const {uploadChunkedVideoCheck} = require('./upload.chunked-video-check.controller');
const {uploadChunkedVideoStarted} = require('./upload.chunked-video-started.controller');
const {uploadChunkedVideoStart} = require('./upload.chunked-video-start.controller');
const {uploadChunkedVideoAbort} = require('./upload.chunked-video-abort.controller');

module.exports = {
  uploadDelete,
  uploadFind,
  uploadGet,
  uploadPatch,
  uploadPost,
  uploadGetSignedUrl,
  uploadVideo,
  uploadChunkedVideo,
  uploadChunkedVideoCheck,
  uploadChunkedVideoStarted,
  uploadChunkedVideoStart,
  uploadChunkedVideoAbort
};
