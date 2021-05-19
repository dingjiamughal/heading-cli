const Commander = require('commander');
const pkg = require('../package.json');
const { chalk } = require('@cx-heading/utils');
const leven = require('leven');

const program = new Commander.Command();

function invokeCommander() {
  program
    .name('cx-heading')
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', '是否开启调试模式', false);

  program
    .command('init [projectName]')
    .option('-f, --force', '是否强强制初始化项目')
    .action((projectName, cmd) => {
      // cx-heading init myapp -f
      // output: myapp {force: true}
      console.log(projectName, cmd);
    });

  // program.on('option:debug', function () {
  //   if (process.debug) {
  //     process.env.LOG_LEVEL = 'verbose';
  //   } else {
  //     process.env.LOG_LEVEL = 'info';
  //   }

  //   log.verbose('test');
  // });

  /**
   * 未知 command 处理
   * forked from https://github.com/vuejs/vue-cli/blob/dev/packages/%40vue/cli/bin/vue.js#L201
   */
  program.on('command:*', ([cmd]) => {
    program.outputHelp();
    console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`));
    console.log();
    suggestCommands(cmd);
    process.exitCode = 1;
  });

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

module.exports = invokeCommander;
