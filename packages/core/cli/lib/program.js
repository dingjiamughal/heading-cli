const program = require('commander');
const pkg = require('../package.json');
const { chalk } = require('@cx-heading/utils');
const leven = require('leven');
const init = require('@cx-heading/cli-init');
const exec = require('@cx-heading/exec');
const log = require('@cx-heading/log');
const dedent = require('dedent');

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
    .command('interface')
    .description(
      dedent`📚 ${chalk.bold.green('生成 interface')}
      ${chalk.bold.green(
        '🏷  默认将 api 文档全量生成 interface，如果不需要这么激进，可以选择性的生成想要的模块，例如只需要【财务 & 资料】↓↓'
      )}

      ${chalk.yellow('step1:')} 类似配置 .babelrc 一样，在项目根目录下新建文件 .headingrc
      ${chalk.yellow('step2:')} 黏贴 👉 ${chalk.yellow(`{ include: ['财务', '资料'] }`)}
      ${chalk.yellow('step3:')} 运行命令 yarn gen:interface 或 npx cx-heading interface ${chalk.bold.cyan(
        '(首次很耗时，推荐更新下项目依赖用第一种方式)'
      )}

      ${chalk.bold.green('最终生成的文件在 swagger 文件夹 enjoy 😼')}
      ${chalk.bold.red('最后报的 error 不影响使用，是出于节能环保开了子进程，不能监听到函数结束，所以手动 exit 了')}
    `
    )

    .option('-tp, --targetPath <path>', '是否指定本地调试文件路径(本地调试用)', '')
    .action(exec)
    .on('option:targetPath', function () {
      process.env.CLI_TARGET_PATH = this._optionValues.targetPath;
    });

  program
    .command('pub')
    .description(
      dedent`
      📚 ${chalk.bold.green('代码本地发布')}

      👀 ${chalk.bold.green(
        `和 cicd 正常流程不一样，为了节约时间，不会每次构建之前 install
   如果有依赖需要更新，则 👉 在命令结尾加上 -i，如：「yarn gen:pub -i / cx-heading pub -i」 表示需要更新依赖，脚本会重新 install 一下`
      )}

      📶 ${chalk.bold.yellow(
        `确保当前电脑已登陆过跳板机，否则在最后推 cdn 过程会重复身份校验导致进程挂掉(亲测很危险)，跳板机账号/密码同 gitlab 账号/密码
   可以先在本项目终端下运行 npm run pub 走一次推送，此后走该脚本进行发布`
      )}
    `
    )
    .option('-i, --install', '如果项目依赖有更新，重新 install 依赖')
    .option('-tp, --targetPath <path>', '是否指定本地调试文件路径(本地调试用)', '')
    .action(exec)
    .on('option:targetPath', function () {
      process.env.CLI_TARGET_PATH = this._optionValues.targetPath;
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
