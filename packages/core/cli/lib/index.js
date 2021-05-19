'use strict';

const log = require('@cx-heading/log');
const invokeCommander = require('./program');
const prepare = require('./prepare');

async function cli() {
  try {
    await prepare();
    invokeCommander();
    // log.verbose('debug', 'debugger log here');
  } catch (e) {
    log.error(e.message);
  }
}

module.exports = cli;
