const logger = require('log4js').getLogger('zoom-delete-meeting');
const ZoomService = require('../../shared/services/zoom');

exports.deleteMeeting = async function (req, res, next) {
  try {
    const {user, params} = req;
    const {meetingId} = params;
    const zoomService = new ZoomService(user);
    return res.status(200).jsend.success({meetingDetails: await zoomService.deleteMeeting(meetingId)});
  } catch (e) {
    return res.status(500).send("Something went wrong");
  }
};

