const logger = require('../../config/log4js')('user');
const {cloudinaryUpload} = require('../../shared/utils');
const config = require('../../config/config');
const {USER_STATUS} = require('../../shared/config/constants');

exports.updateAvatar = async function (req, res, next) {
  const {user, file} = req;
  if (!user || user.status === USER_STATUS.DELETED.key) {
    return res.status(401).jsend.fail('unauthorised');
  }

  let cloudOptions = {
    public_id: `${user.id}/avatar`,
    tags: [user.id, 'avatar']
  };
  cloudOptions.eager = [
    config.avatar.transformation,
    config.avatarThumbnail.transformation,
    config.avatarHomePage.transformation
  ];

  let avatar;
  let avatarThumbnail;
  let avatarHomePage;
  try {
    const cloudResults = await cloudinaryUpload(file.path, cloudOptions);
    const userProfile = await user.getUserProfile();

    avatar = cloudResults.eager[0].secure_url;
    avatarThumbnail = cloudResults.eager[1].secure_url;
    avatarHomePage = cloudResults.eager[2].secure_url;

    userProfile.avatarDetails = {
      cloud: config.cloudinary.cloud,
      publicId: cloudResults.public_id,
      version: cloudResults.version,
      format: cloudResults.format,
      resourceType: cloudResults.resource_type,
      type: cloudResults.type,
    };

    await userProfile.save();
    return res.status(200).jsend.success({avatar, avatarThumbnail, avatarHomePage});
  } catch (err) {
    logger.warn(err.stack);
    return res.status(500).jsend.fail(err);
  }
};
