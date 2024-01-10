const logger = require('log4js').getLogger('zoom-update-meeting');
const ZoomService = require('../../shared/services/zoom');

exports.updateMeeting = async function (req, res, next) {
  try {
    const {user, body, params} = req;
    const {meetingId} = params;
    const zoomService = new ZoomService(user);
    return res.status(200).jsend.success({meetingDetails: await zoomService.updateMeeting(meetingId, body)});
  } catch (e) {
    return res.status(500).send("Something went wrong");
  }
};

