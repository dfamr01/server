const dotenv = require('dotenv');
const local = 'loc';
const test = 'test';
const development = 'dev';
const production = 'prod';

const envs = {local, test, development, production};

exports.getEnvPrefix = function () {
  return envs[process.env.NODE_ENV] ? envs[process.env.NODE_ENV] : production;
};

module.exports = function () {
  let path = `server/config/env/.env.${exports.getEnvPrefix()}`;
  return dotenv.config({path});
};
