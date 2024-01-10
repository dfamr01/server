const logger = require('../../config/log4js')('workshop-update-cover-photo-ctrl');
const {cloudinaryUpload} = require('../../shared/utils');
const config = require('../../config/config');

exports.updateCoverPhoto = async function (req, res, next) {
  try {
    const {user, workshop, file} = req;

    let cloudOptions = {
      public_id: `user_${user.id}/workshop_${workshop.id}/cover-photo`,
      tags: [user.id, workshop.id, 'cover-photo']
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
    workshop.coverPhotoDetails = {
      cloud: config.cloudinary.cloud,
      publicId: cloudResults.public_id,
      version: cloudResults.version,
      format: cloudResults.format,
      resourceType: cloudResults.resource_type,
      type: cloudResults.type,
    };
    await workshop.save();
    return res.status(200).jsend.success({coverPhoto, coverPhotoThumbnail, coverPhotoHomePage, coverPhotoInspect});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};
