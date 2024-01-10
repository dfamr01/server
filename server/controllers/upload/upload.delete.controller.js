const logger = require('../../config/log4js')('upload-delete-ctrl');

exports.uploadDelete = async function (req, res, next) {
  try {
    const {user, upload} = req;
    await upload.destroy();
    return res.status(200).jsend.success({
      success: true
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

