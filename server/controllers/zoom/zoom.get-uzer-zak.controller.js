const logger = require('log4js').getLogger('zoom-get-user-zak');
const ZoomService = require('../../shared/services/zoom');

exports.getUserZak = async function (req, res, next) {
  try {
    const {user} = req;
    const zoomService = new ZoomService(user);
    const {token} = await zoomService.getUserZak();
    return res.status(200).jsend.success({zak: token});
  } catch (e) {
    return res.status(500).send("Something went wrong");
  }
};

