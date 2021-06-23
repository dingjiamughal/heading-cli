'use strict';

const Command = require('@cx-heading/command');
const log = require('@cx-heading/log');
const path = require('path');
const fse = require('fs-extra');
const axios = require('axios');
const pick = require('lodash/pick');
const { generateApi } = require('swagger-typescript-api');
const asyncEach = require('async/each');
const { exec, execSync } = require('child_process');
const prettier = require('prettier');
const { cosmiconfig, cosmiconfigSync } = require('cosmiconfig');

const baseUrl = 'http://cxerp-sd.k8s1.internal.weimobdev.com/heading/cx/main';

class InitCommand extends Command {
  init() {
    // const options = this.argv[0];
    // this.force = options.force;

    console.log('初始化... interface transfer 并不需要啥初始化');
  }

  async exec() {
    const explorer = cosmiconfig('heading');

    // Search for a configuration by walking up directories.
    // See documentation for search, below.
    const result = await explorer.search();
    const whiteList = result.config.include;

    const { data: types } = await axios.get(
      'http://cxerp-sd.k8s1.internal.weimobdev.com/heading/cx/main/swagger-resources'
    );

    const series = types.map(item => pick(item, ['name', 'url']));

    asyncEach(series, async (item, index) => {
      if (whiteList && whiteList.length && !whiteList.some(it => item.name.includes(it))) {
        return;
      }
      const { data: json } = await axios.get(encodeURI(baseUrl + item.url));

      fse.writeFileSync(
        path.join(process.cwd(), `${item.name}.json`),
        typeof json === 'object' ? JSON.stringify(json) : json,
        { encoding: 'utf-8' }
      );
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
