'use strict';

const Command = require('@cx-heading/command');
const log = require('@cx-heading/log');
const path = require('path');
const fse = require('fs-extra');
const axios = require('axios');
const _ = require('lodash');
const { generateApi } = require('swagger-typescript-api');
const asyncEach = require('async/each');
const { exec, execSync } = require('child_process');
const prettier = require('prettier');
const { cosmiconfig, cosmiconfigSync } = require('cosmiconfig');
const qs = require('querystring');

const baseUrl = 'http://cxerp-sd.k8s1.internal.weimobdev.com/heading/cx/main';

class InitCommand extends Command {
  init() {
    const options = this.argv[0];
    this.force = options.force;
  }

  async exec() {
    const explorer = cosmiconfig('heading');

    // Search for a configuration by walking up directories.
    // See documentation for search, below.
    const result = await explorer.search();
    console.log(result);
    const whiteList = result.config.include;

    const { data: types } = await axios.get(
      'http://cxerp-sd.k8s1.internal.weimobdev.com/heading/cx/main/swagger-resources'
    );

    const series = types.map(item => _.pick(item, ['name', 'url']));

    asyncEach(series, async (item, index) => {
      if (whiteList && whiteList.length && !whiteList.some(it => item.name.includes(it))) {
        return;
      }
      const { data: json } = await axios.get(encodeURI(baseUrl + item.url));
      console.log(json);
      // const json5 = prettier.format(json, {
      //   semi: true,
      //   tabWidth: 2,
      //   singleQuote: true,
      //   trailingComma: 'none',
      //   parser: 'json'
      // });
      // console.log(json5);

      fse.writeFileSync(path.join(process.cwd(), `${item.name}.json`), json, { encoding: 'utf-8' });
      generateApi({
        name: `${item.name}.ts`,
        output: path.resolve(process.cwd(), './__generated__'),
        input: path.resolve(process.cwd(), `${item.name}.json`)
      });

      // execSync(`npx swagger-typescript-api -p ${item.name}.json -n ${item.name}.ts`);
    });
  }
}

function init(args) {
  return new InitCommand(args);
}

module.exports = init;