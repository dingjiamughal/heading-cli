const program = require('commander');
const pkg = require('../package.json');
const { chalk } = require('@cx-heading/utils');
const leven = require('leven');
const init = require('@cx-heading/cli-init');
const exec = require('@cx-heading/exec');
const log = require('@cx-heading/log');

// const program = new Command();

function invokeProgram() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', '是否开启调试模式', false)
    .on('option:debug', function () {
      if (this._optionValues.debug) {
        process.env.LOG_LEVEL = 'verbose';
      } else {
        process.env.LOG_LEVEL = 'info';
      }

      log.level = process.env.LOG_LEVEL;
    });

  program
    .command('init [projectName]')
    .description('初始化项目')
    .option('-f, --force', '覆盖当前文件')
    .option('-tp, --targetPath <path>', '是否指定本地调试文件路径', '')
    .action(exec)
    .on('option:targetPath', function () {
      // TODO: 文档上的不太行啊
      // https://github.com/tj/commander.js/blob/master/Readme_zh-CN.md#%E8%87%AA%E5%AE%9A%E4%B9%89%E4%BA%8B%E4%BB%B6%E7%9B%91%E5%90%AC
      process.env.CLI_TARGET_PATH = this._optionValues.targetPath;
    });

  /**
   * 未知 command 处理
   * forked from https://github.com/vuejs/vue-cli/blob/dev/packages/%40vue/cli/bin/vue.js#L201
   */
  // program.on('command:*', ([cmd]) => {
  //   program.outputHelp();
  //   console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`));
  //   console.log();
  //   suggestCommands(cmd);
  //   process.exitCode = 1;
  // });

  program.parse(process.argv);
}

function suggestCommands(unknownCommand) {
  const availableCommands = program.commands.map(cmd => cmd.name());
  console.log(availableCommands);
  let suggestion;

  availableCommands.forEach(cmd => {
    const isBestMatch = leven(cmd, unknownCommand) < leven(suggestion || '', unknownCommand);

    if (leven(cmd, unknownCommand) < 3 && isBestMatch) {
      suggestion = cmd;
    }
  });

  if (suggestion) {
    console.log(`  ` + chalk.red(`Did you mean ${chalk.yellow(suggestion)}?`));
  }
}

module.exports = invokeProgram;
