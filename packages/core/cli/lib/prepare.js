const checkMiddleWare = require('../middleware/check');
const upgrade = require('../middleware/upgrade');

/**
 * prepare
 */
async function prepare() {
  checkMiddleWare.checkPkgVersion();
  checkMiddleWare.checkNodeJsVersion();
  checkMiddleWare.checkRoot();
  checkMiddleWare.checkUserHome();
  // checkMiddleWare.checkArgs();
  checkMiddleWare.checkEnv();

  await upgrade();
}

module.exports = prepare;
