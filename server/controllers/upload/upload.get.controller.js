const logger = require('../../config/log4js')('upload-get-ctrl');

exports.uploadGet = async function (req, res, next) {
  try {
    return res.status(200).jsend.success({
      upload: req.upload.filterFieldsFor({key: 'get', rootOnly: true}),
    });
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};

