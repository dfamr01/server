const logger = require('log4js').getLogger('zoom-refresh-user-token');
const ZoomService = require('../../shared/services/zoom');

exports.refreshUserToken = async function (req, res, next) {
  try {
    const {user} = req;
    const zoomService = new ZoomService(user);
    await zoomService.refreshAccessToken()
    return res.status(200).jsend.success({zoomConnected: true});
  } catch (e) {
    return res.status(401).jsend.fail(new Error('Could not connect with Zoom'), {error: 'couldNotConnectWithZoom'});
  }
};

