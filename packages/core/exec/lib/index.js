'use strict';

const path = require('path');
const Package = require('@cx/package');
const log = require('@cx/log');
const SETTINGS = require('./settings');

// 原先就想照搬 vuecli，exec command 放在 cli/util
// 想到后面可能会有别的模块需要 exec，例如 publish
async function execCommand(...args) {
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  // log.verbose('targetPath', targetPath);
  log.verbose('homePath', homePath);

  let cxPkg;
  let cachePath = '';
  const cmd = args[args.length - 1];

  const packageName = SETTINGS[cmd.name()];
  const packageVersion = 'latest';

  // -tp 不存在，就创建到根目录下的缓存目录 /Users/dingjia/dependencies
  if (!targetPath) {
    // cache path
    targetPath = path.resolve(homePath, 'dependencies');
    // 下载的依赖放到 node_modules
    cachePath = path.resolve(targetPath, 'node_modules');

    cxPkg = new Package({
      targetPath,
      cachePath,
      packageName,
      packageVersion
    });

    // Is this pkg exist ???
    if (await cxPkg.exist()) {
      // npm upgrade package
      await cxPkg.update();
    } else {
      // npm install package
      await cxPkg.install();
    }
  }
  // -tp 存在，本地的package，就是最新的不用更新
  else {
    log.verbose('targetPath 为本地地址');
    cxPkg = new Package({ targetPath, packageName, packageVersion });
  }

  // ↑↑↑ 拿到了 cxPkg 实例，并且当前 pacakge 是最新的
  const rootFile = cxPkg.getFileLibPath();

  // console.log(process.env.CLI_TARGET_PATH);
}

module.exports = execCommand;
