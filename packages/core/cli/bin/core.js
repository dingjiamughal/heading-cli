const importLocal = require('import-local');

// 全局安装包本地有安装，优先使用本地的
if (importLocal(__filename)) {
  require('npmlog').info('cli', '本地 cli 模块执行');
} else {
  require('../lib')(process.argv.slice(2));
}
