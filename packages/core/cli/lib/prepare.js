const checkMiddleWare = require('../util/check');
const upgrade = require('../util/upgrade');

/**
 * prepare
 */
async function prepare() {
  // checkMiddleWare.checkPkgVersion();
  // checkMiddleWare.checkNodeJsVersion();
  // checkMiddleWare.checkRoot();
  // checkMiddleWare.checkUserHome();
  // checkMiddleWare.checkArgs();
  checkMiddleWare.checkEnv();

  await upgrade();
}

module.exports = prepare;
