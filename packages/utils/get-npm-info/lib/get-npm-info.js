'use strict';
const axios = require('axios');
const semver = require('semver');

async function getNpmInfo(npmName, registry) {
  if (!npmName) {
    return false;
  }
  const registryUrl = registry ? registry : 'https://registry.npmjs.org';
  const npmPkgUrl = registryUrl + '/' + npmName;

  // 对 npm 发起请求
  const data = await axios.get(npmPkgUrl);

  if (data.status !== 200) {
    return false;
  }

  return data.data;
}

/**
 * 获取 npm package 所有历史版本号
 * @param {string} npmName npm package name
 * @returns {string[]} all package versions
 */
async function getVersions(npmName) {
  const data = await getNpmInfo(npmName);
  return data ? Object.keys(data.versions) : [];
}

/**
 * 获取所有大于本地的版本号
 * @param {string} localVersion 本地 version
 * @param {string[]} versions 所有历史版本号
 * @returns
 */
async function getNpmVersionsUpper(localVersion, versions) {
  return versions.filter(version => semver.satisfies(version, `>${localVersion}`)).sort((a, b) => semver.gt(b, a));
}

/**
 * 获取远端最新版本
 */
async function getNpmLatestVersion(npmName) {
  const versions = await getVersions(npmName);
  if (versions.length) {
    return versions.sort((a, b) => semver.gt(b, a)).reverse()[0];
  }

  return null;
}

module.exports = {
  getNpmInfo,
  getVersions,
  getNpmVersionsUpper,
  getNpmLatestVersion
};
