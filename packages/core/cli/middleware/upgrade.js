const pkg = require('../package.json');
const { getNpmInfo, getVersions, getNpmVersionsUpper } = require('@cx-heading/get-npm-info');
const log = require('@cx-heading/log');
const sermer = require('semver');
const chalk = require('chalk');
const dedent = require('dedent');

async function updateVersion() {
  const version = pkg.version;
  const pkgName = pkg.name;

  const versions = await getVersions(pkgName);
  const upperVersions = await getNpmVersionsUpper(version, versions);

  if (upperVersions && upperVersions[0] && sermer.gt(upperVersions[0], version)) {
    log.warn(
      chalk.yellow(dedent`cli 版本过低，建议更新至最新版本 ${pkgName}
      当前版本为: ${version}
      最新版本为: ${upperVersions[0]}
      To install: yarn global add ${pkgName}
    `)
    );
  }
}

module.exports = updateVersion;
