'use strict';

const Command = require('@cx-heading/command');
const log = require('@cx-heading/log');
const inquirer = require('inquirer');
const chalk = require('chalk');
const pkgDir = require('pkg-dir').sync;
const fse = require('fs-extra');
const pathExists = require('@cx-heading/path-exists').sync;
const path = require('path');
const simpleGit = require('simple-git/promise');
const shelljs = require('shelljs');
const npminstall = require('npminstall');
const cp = require('child_process');

class InitCommand extends Command {
  async init() {
    const options = this.argv[0];
    this.shouldUpdate = options.install;

    const answers = await inquirer.prompt([
      {
        name: 'branch',
        message: '需要发布那个环境',
        type: 'list',
        choices: [
          { name: 'dev', value: 'dev' },
          { name: 'qa', value: 'qa' }
        ]
      }
    ]);
    log.verbose(JSON.stringify(answers));
    this.branch = answers.branch;

    console.log(chalk.bold.green(`开始发布，环境为: ${this.branch}`));
  }

  async exec() {
    const homePath = process.env.CLI_HOME_PATH;

    console.log(process.cwd());
    if (!pathExists(path.join(homePath, 'saas-fe-console-heading'))) {
      console.log('开始 clone');
      const git = simpleGit();
      // .silent(true)
      await git.clone(
        'ssh://git@stash.weimob.com:7999/cx/saas-fe-console-heading.git',
        path.join(homePath, 'saas-fe-console-heading')
      );
      shelljs.cd(path.join(homePath, 'saas-fe-console-heading'));
      console.log('clone 成功');
      cp.spawnSync('git', ['checkout', 'feature/dev'], { cwd: process.cwd(), stdio: 'inherit' });

      console.log('start install');
      await npminstall({
        root: path.join(homePath, 'saas-fe-console-heading'),
        registry: 'http://npm.weimob.com'
      });

      console.log('installed');
    }

    // shelljs.cd(path.join(homePath, 'saas-fe-console-heading'));

    const git = simpleGit(path.join(homePath, 'saas-fe-console-heading'));

    if (this.shouldUpdate) {
    }

    const status = await git.status();
    console.log(status);

    shelljs.cd(path.join(homePath, 'saas-fe-console-heading'));
    const ls = cp.spawn('bash', [path.resolve(__dirname, './ci.sh'), this.branch], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });

    let stdMsg = '';
    ls.stdout.on('data', data => {
      stdMsg = data;
    });
    ls.stderr.on('data', err => {
      stdMsg = err;
    });

    ls.on('close', async code => {
      console.log(`exit code: ${code}`);
      console.log(stdMsg.toString());
    });

    // TODO: diff deps 后期优化吧
    // diff deps
    // const deps = require(path.join(process.cwd(), 'package.json')).dependencies;
    // const cacheDeps = require(path.join(homePath, 'saas-fe-console-heading/package.json')).dependencies;

    // let isEqual = true
    // Object.keys(cacheDeps).forEach((key,index)=> {
    //   if (!deps[key])
    // })
  }

  async install() {
    const homePath = process.env.CLI_HOME_PATH;

    console.log('start install');
    await npminstall({
      root: path.join(homePath, 'saas-fe-console-heading'),
      registry: 'http://npm.weimob.com'
    });

    console.log('installed');
  }
}

function init(args) {
  return new InitCommand(args);
}

module.exports = init;
