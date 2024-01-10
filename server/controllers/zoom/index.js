const {authUser} = require('./zoom.auth-user.controller');
const {deleteMeeting} = require('./zoom.delete-meeting.controller');
const {getMeeting} = require('./zoom.get-meeting.controller');
const {getUserZak} = require('./zoom.get-uzer-zak.controller');
const {postMeeting} = require('./zoom.post-meeting.controller');
const {refreshUserToken} = require('./zoom.refresh-user-token.controller');
const {signature} = require('./zoom.signature.controller');
const {updateMeeting} = require('./zoom.update-meeting.controller');


module.exports = {
  authUser,
  deleteMeeting,
  getMeeting,
  getUserZak,
  postMeeting,
  refreshUserToken,
  signature,
  updateMeeting
};
