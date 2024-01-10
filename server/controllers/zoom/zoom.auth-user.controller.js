const logger = require('log4js').getLogger('zoom-auth-user');
const {getNowUTC} = require('../../shared/utils/date.utils');
const ZoomService = require('../../shared/services/zoom');


exports.authUser = async function (req, res, next) {
  try {
    const {body, user} = req;
    const {code, zoomRedirectUrl} = body;
    const zoomService = new ZoomService(user);
    const zoomToken = await zoomService.authenticateUser(code, zoomRedirectUrl);
    logger.info('zoomToken', zoomToken);
    user.zoomDetails = zoomToken;
    const zoomUserDetails = await zoomService.getUserInfo();
    logger.info('zoomUserDetails', zoomUserDetails);
    user.zoomDetails = {
      email: zoomUserDetails.email,
      account_id: zoomUserDetails.account_id,
      access_token: zoomToken.access_token,
      refresh_token: zoomToken.refresh_token,
      expires_in: zoomToken.expires_in,
      expires_at: getNowUTC().add(zoomToken.expires_in, 'seconds')
    };
    await user.save();
    return res.status(200).jsend.success({zoomConnected: true});
  } catch (e) {
    return res.status(401).jsend.fail(new Error('Could not connect with Zoom'), {error: 'couldNotConnectWithZoom'});
  }
};

