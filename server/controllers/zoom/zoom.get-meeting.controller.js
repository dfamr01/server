const logger = require('log4js').getLogger('zoom-get-meeting');
const ZoomService = require('../../shared/services/zoom');

exports.getMeeting = async function (req, res, next) {
  try {
    const {user, params} = req;
    const {meetingId} = params;
    const zoomService = new ZoomService(user);
    return res.status(200).jsend.success({meetingDetails: await zoomService.getMeeting(meetingId)});
  } catch (e) {
    return res.status(500).send("Something went wrong");
  }
};

