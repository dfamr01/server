const logger = require('log4js').getLogger('zoom-post-meeting');
const ZoomService = require('../../shared/services/zoom');

exports.postMeeting = async function (req, res, next) {
  try {
    const {user, body} = req;
    const zoomService = new ZoomService(user);
    return res.status(200).jsend.success({meetingDetails: await zoomService.createMeeting(body)});
  } catch (e) {
    return res.status(500).send("Something went wrong");
  }
};

