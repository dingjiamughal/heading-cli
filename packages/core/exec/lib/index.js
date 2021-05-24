'use strict';

const path = require('path');
const cp = require('child_process');
const Package = require('@cx-heading/package');
const log = require('@cx-heading/log');
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
  const packageVersion = '0.0.1';

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

    if (await cxPkg.exist()) {
      await cxPkg.update();
    } else {
      await cxPkg.install();
    }
  }
  // -tp 存在，本地的package，就是最新的不用更新
  else {
    log.verbose('targetPath 为本地地址');
    cxPkg = new Package({ targetPath, packageName, packageVersion });
  }

  // ↑↑↑ 拿到了 cxPkg 实例，并且当前 pacakge 是最新的
  const rootFile = cxPkg.getFileLibPath(); // 执行lib下的函数
  log.verbose('rootFile', rootFile);
  try {
    // require(rootFile)(...args);
    const effectCommand = {};
    Object.keys(cmd).forEach(key => {
      if (cmd.hasOwnProperty(key) && !key.startsWith('_') && key !== 'parent') {
        effectCommand[key] = cmd[key];
      }
    });
    args[args.length - 1] = effectCommand;
    // console.log(args);
    const code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`;

    // 使用 stdid: inherit 模式，terminal 中可以展示详细日志
    const child = cp.spawn('node', ['-e', code], { cwd: process.cwd(), stdio: 'inherit' });
    // child.stdout.on('data', chunk => {});
    // child.stderr.on('data', chunk => {});

    child.on('error', e => {
      log.error(e.message);
      process.exit(1);
    });
    child.on('exit', e => {
      log.verbose('执行成功', e);
      process.exit(1);
    });
  } catch (err) {
    console.log(err);
  }
  // console.log(process.env.CLI_TARGET_PATH);
}

module.exports = execCommand;
