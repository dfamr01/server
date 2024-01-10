const logger = require('../../config/log4js')('upload-patch-ctrl');

exports.uploadPatch = async function (req, res, next) {
  try {
    const {user, upload} = req;
    const updatedUpload = await upload.filterUpdateFieldsFor({key: 'update', data: req.body});

    return res.status(200).jsend.success({
      upload: updatedUpload.filterFieldsFor({key: 'get'}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

