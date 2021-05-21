const path = require('path');
const log = require('@cx-heading/log');
const sermer = require('semver');
const { LOWEST_NODE_VERSION } = require('../const');
const chalk = require('chalk');
const pathExists = require('path-exists').sync;
const osHomedir = require('os-homedir');
// const rootCheck = require('root-check');
const minimist = require('minimist');
const dotenv = require('dotenv').config;

class Check {
  checkPkgVersion() {
    //   console.log(pkg);
    //   console.log(pkg.version);
    //   log.success('tesdt', 'success...');
  }

  checkNodeJsVersion() {
    const currentVersion = process.version;
    if (!sermer.gte(currentVersion, LOWEST_NODE_VERSION)) {
      throw new Error(chalk.red(`node 版本必须大于 ${LOWEST_NODE_VERSION}`));
    }
  }

  checkRoot() {
    // uid 0 => sudo 501 => guest
    //   rootCheck();
    // root check 之后 uid 变成 501
    // console.log(process.getuid());
  }

  checkUserHome() {
    const userHome = osHomedir();

    if (!userHome || !pathExists(userHome)) {
      throw new Error(chalk.red('当前用户主目录不存在'));
    }
  }

  checkArgs() {
    const args = minimist(process.argv.slice(2));
    process.env.LOG_LEVEL = args.debug ? 'verbose' : 'info';

    log.level = process.env.LOG_LEVEL;
  }

  checkEnv() {
    const userHome = osHomedir();

    const dotenvPath = path.resolve(userHome, '.env');
    if (pathExists(dotenvPath)) {
      dotenv({ path: dotenvPath });
    }

    if (process.env.CLI_HOME) {
      process.env.CLI_HOME_PATH = path.join(userHome, process.env.CLI_HOME);
    } else {
      process.env.CLI_HOME_PATH = path.join(userHome, 'cx-cli-home');
    }
  }
}

module.exports = new Check();
