'use strict';

exports.chalk = require('chalk');
// exports.execa = require('execa');
exports._ = require('lodash');

exports.sleep = (delay = 1000) => {
  return new Promise(resolve => setTimeout(resolve, delay));
};
