const logger = require('../../config/log4js')('event-update-cover-photo-ctrl');
const config = require('../../config/config');

const {cloudinaryUpload} = require('../../shared/utils');

exports.updateCoverPhoto = async function (req, res, next) {
  try {
    const {user, event, file} = req;

    let cloudOptions = {
      public_id: `user_${user.id}/event_${event.id}/cover-photo`,
      tags: [user.id, event.id, 'cover-photo']
    };
    cloudOptions.eager = [
      config.coverPhoto.transformation,
      config.coverPhotoThumbnail.transformation,
      config.coverPhotoHomePage.transformation,
      config.coverPhotoInspect.transformation
    ];

    let coverPhoto;
    let coverPhotoThumbnail;
    let coverPhotoHomePage;
    let coverPhotoInspect;

    const cloudResults = await cloudinaryUpload(file.path, cloudOptions);
    coverPhoto = cloudResults.eager[0].secure_url;
    coverPhotoThumbnail = cloudResults.eager[1].secure_url;
    coverPhotoHomePage = cloudResults.eager[2].secure_url;
    coverPhotoInspect = cloudResults.eager[3].secure_url;
    event.coverPhotoDetails = {
      cloud: config.cloudinary.cloud,
      publicId: cloudResults.public_id,
      version: cloudResults.version,
      format: cloudResults.format,
      resourceType: cloudResults.resource_type,
      type: cloudResults.type,
    };

    await event.save();
    return res.status(200).jsend.success({coverPhoto, coverPhotoThumbnail, coverPhotoHomePage, coverPhotoInspect});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};
