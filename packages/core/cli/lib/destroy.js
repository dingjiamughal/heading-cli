const program = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const pkg = require('../package.json');
const path = require('path');
const fs = require('fs');
const { promises: pfs } = require('fs');
const asyncReduce = require('async/reduce');
const _ = require('lodash');
const prettier = require('prettier');
const shelljs = require('shelljs');
const yaml = require('js-yaml');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const dedent = require('dedent');

const modules = {
  page: path.join(process.cwd(), 'src/pages'),
  service: path.join(process.cwd(), 'src/services')
};

async function getModuleMap(ns) {
  const files = await pfs.readdir(modules[ns]);

  const dirs = await asyncReduce(files, {}, async (memo, file) => {
    const filePath = path.join(modules[ns], file);
    const fileStat = await pfs.stat(filePath);
    if (fileStat.isDirectory()) {
      const pages = (await pfs.readdir(filePath)).filter(p => !p.includes('.')); // 简单判断一下，因为通常情况都是 <module>/<pageName> 的结构
      memo[file] = pages;
    }
    return memo;
  });

  return dirs;
}

function formatter(text, parser = 'babel-ts') {
  const prettierConfig = fs.readFileSync(path.resolve(__dirname, '../.prettierrc'), 'utf8');
  const code = prettier.format(text, {
    ...JSON.parse(prettierConfig),
    parser,
    tabWidth: 2
  });
  return code;
}

program
  .version(pkg.version, '-v', '--version')
  .command('create <name>')
  .parse(process.argv)
  .action(async name => {
    if (name !== 'template') {
      console.log(chalk.red('不支持该命令，请输入 cx-heading -h 查看帮助'));
      process.exit(1);
    }

    const [modulePageMap, moduleServiceMap] = await Promise.all([getModuleMap('page'), getModuleMap('service')]);
    const modules = {
      page: modulePageMap,
      service: moduleServiceMap
    };

    // 脏!! generator 文件夹开好了，后面模仿 vuecli2 重写
    const answers = await inquirer.prompt([
      {
        name: 'templateType',
        message: '需要生成哪种模板类型？',
        type: 'list',
        choices: [
          { name: '新页面', value: 'page' },
          { name: 'Service', value: 'service' }
        ]
      },
      {
        name: 'namespace',
        type: 'list',
        message: '请选择模块',
        choices: answers => Object.keys(modules[answers.templateType]).map(k => ({ name: k, value: k }))
      },
      {
        name: 'module',
        type: 'input',
        message: answers => `请输入${answers.namespace}模块下的api`,
        when: answers => answers.templateType === 'service',
        validate: (input, answers) => {
          if (!input) {
            return '不能为空';
          }

          if (moduleServiceMap[answers.namespace].includes(input)) {
            return `存在重复的api：${answers.namespace}/${input}`;
          }
          return true;
        }
      },
      {
        name: 'isDataModel',
        message: '是否生成对应data-model',
        type: 'confirm',
        when: answers => answers.templateType === 'service'
      },
      {
        name: 'pageName',
        type: 'input',
        when: answers => answers.templateType === 'page',
        validate: (input, answers) => {
          if (!input) {
            return '不能为空';
          }

          if (modulePageMap[answers.namespace].includes(input)) {
            return `存在重复的页面：${answers.namespace}/${input}`;
          }
          return true;
        },
        message: answers => `请输入${answers.namespace}模块下的页面`
      },
      {
        name: 'isRedux',
        message: '是否需要redux',
        type: 'confirm',
        when: answers => answers.templateType === 'page'
      }
    ]);

    await plinth(answers);
  }).args.length || program.help();

// yaml 2 json
program
  .command('yaml')
  .usage('cx-heading yaml => yaml转json')
  .action(() => {
    shelljs.cd(process.cwd());
    const ymlFile = [...shelljs.ls('-R', 'src/**/*.static.yaml')];

    ymlFile.forEach(file => {
      const json = yaml.load(fs.readFileSync(path.resolve(file), 'utf8'));
      console.log(json);
      console.log(path.join(process.cwd(), path.dirname(file), path.basename(file).replace('yaml', 'json')));
      fs.writeFileSync(
        path.join(process.cwd(), path.dirname(file), path.basename(file).replace('yaml', 'json')),
        formatter(JSON.stringify(json), 'json'),
        'utf8'
      );
    });
  });

program.parse();

// 分发基座
// TODO: answers 为 context 非常不纯，改成 vue or koa 的插件注册
// xxx.use(run).use(plinth).use(middleware1).use(middleware2)
async function plinth(answers) {
  const task = {
    page: pipeP(renderPage, renderRedux),
    service: pipeP(renderServices, renderDataModel)
    // dataModel: renderDataMoel
  }[answers.templateType];

  return task(answers);
}

// 函数透传
function run(answers) {
  const task = _.curry((answers, fn) => fn(answers));
  return task(answers);
}

async function renderPage(answers) {
  const { namespace, pageName, isRedux } = answers;
  const pageTpl = await pfs.readFile(path.resolve(__dirname, '../generator/pages/template/index.ejs'), 'utf8');
  const text = _.template(pageTpl)({
    name: _.upperFirst(pageName),
    isRedux
  });

  const newPageDir = path.join(process.cwd(), 'src/pages', namespace, _.upperFirst(pageName));
  shelljs.mkdir('-p', newPageDir);

  pfs.writeFile(path.join(newPageDir, 'index.tsx'), formatter(text));

  console.log(chalk.green(`+++ ${path.join(newPageDir, 'index.tsx')}`));

  return answers;
}

async function renderRedux(answers) {
  if (!answers.isRedux) {
    return answers;
  }
  const { pageName, namespace } = answers;

  const [modelTpl, actionTypeTpl] = await Promise.all([
    pfs.readFile(path.resolve(__dirname, '../generator/models/template/index.ejs'), 'utf8'),
    pfs.readFile(path.resolve(__dirname, '../generator/models/template/action.types.ejs'), 'utf8')
  ]);

  const text = {
    model: _.template(modelTpl)({ name: _.upperFirst(pageName) }),
    actionType: _.template(actionTypeTpl)()
  };

  // page 校验了目录是否存在，这边就不校验了
  const dir = path.join(process.cwd(), 'src/models', namespace, pageName);
  shelljs.mkdir('-p', dir);

  pfs.writeFile(path.join(dir, 'index.ts'), formatter(text.model));
  pfs.writeFile(path.join(dir, 'action.types.ts'), formatter(text.actionType));

  console.log(chalk.green(`+++ ${path.join(dir, 'index.ts')}`));
  console.log(chalk.green(`+++ ${path.join(dir, 'action.types.ts')}`));

  return answers;
}

function renderDataMoel(answers) {
  console.log(answers);
}

async function renderServices(answers) {
  const { namespace, module } = answers;
  const tpl = await pfs.readFile(path.resolve(__dirname, '../generator/services/template/index.ejs'), 'utf8');
  const text = _.template(tpl)({ ns: namespace, module });

  const dir = path.join(process.cwd(), 'src/services', namespace, module);
  shelljs.mkdir('-p', dir);

  pfs.writeFile(path.join(dir, 'index.ts'), formatter(text));

  console.log(chalk.green(`+++ ${path.join(dir, 'index.ts')}`));

  return answers;
}

async function renderDataModel(answers) {
  const { namespace, module, isDataModel } = answers;
  if (!isDataModel) {
    return answers;
  }
  // 暴力生成三个空文件
  const dir = path.join(process.cwd(), 'src/dataModel', namespace, module);

  ['interface', 'enum', 'map'].forEach(ns => {
    shelljs.mkdir('-p', dir);
    shelljs.touch(`${dir}/${ns}.ts`);
    console.log(chalk.green(`+++ ${dir}/${ns}.ts`));
  });

  return answers;
}

function pipeP(...fns) {
  return param => fns.reduce(async (result, next) => next(await result), param);
}
