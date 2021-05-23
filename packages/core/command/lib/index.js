'use strict';
const semver = require('semver');
const chalk = require('chalk');
const log = require('@cx-heading/log');
const isArray = require('lodash/isArray');

const LOWEST_NODE_VERSION = '12.0.0';
/**
 * Commander 运行时基类
 * 借鉴了 lerna command 模块
 * forked from https://github.com/lerna/lerna/blob/main/core/command/index.js
 */
class Command {
  constructor(options) {
    if (!options) {
      throw new Error('Command options 不能为空');
    }

    if (!isArray(options)) {
      throw new Error('Command options 必须是个数组');
    }

    this.argv = options;

    const runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain = chain.then(() => this.checkNodeJsVersion());
      chain = chain.then(() => this.initArgs());
      chain = chain.then(() => this.init());
      chain = chain.then(() => this.exec());

      chain.catch(err => {
        log.error(err.message);
      });
    });
  }

  checkNodeJsVersion() {
    const currentVersion = process.version;
    if (!semver.gte(currentVersion, LOWEST_NODE_VERSION)) {
      throw new Error(chalk.red(`node 版本必须大于 ${LOWEST_NODE_VERSION}`));
    }
  }

  initArgs() {
    this.cmd = this.argv[this.argv.length - 1];
    this.argv = this.argv.slice(0, this.argv.length - 1);
    console.log(this.argv);
  }

  init() {
    throw new Error('必须有私有 init 方法');
  }

  exec() {
    throw new Error('必须有私有 exec 方法');
  }
}

module.exports = Command;
