const cloudinary = require('cloudinary');

const config = require('./config');

module.exports = function configCloudinary() {
  cloudinary.config({
    cloud_name: config.cloudinary.cloud,
    api_key: config.cloudinary.key,
    api_secret: config.cloudinary.secret
  });
};
